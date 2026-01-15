import { PrismaClient } from "../app/generated/prisma";
import { MoneyBand, PoiMode } from "../app/generated/prisma";
import { NOMADLY_CATEGORIES, getCategoryGroup } from "./nomadly-categories";

const prisma = new PrismaClient();

interface FoursquareVenue {
  fsq_place_id: string;
  name: string;
  location: {
    address?: string;
    latitude: number;
    longitude: number;
    city?: string;
    state?: string;
    country?: string;
    locality?: string;
  };
  categories: Array<{
    id: string; // Now BSON category ID instead of integer
    name: string;
  }>;
  price?: number; // 1-4 scale
  rating?: number; // 1-10 scale
  popularity?: number;
}

export class FoursquareSeeder {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.FOURSQUARE_API_KEY!;
  }

  // Get Foursquare venues for a specific city and category
  async getVenues(city: string, categoryIds: string, limit: number = 50) {
    const response = await fetch(
      `https://places-api.foursquare.com/places/search?near=${encodeURIComponent(
        city
      )}&categories=${categoryIds}&limit=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          Accept: "application/json",
          "X-Places-Api-Version": "2025-06-17", // Current API version
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Foursquare API error: ${response.status}`);
    }

    const data = await response.json();
    return data.results as FoursquareVenue[];
  }

  // Seed POIs from Foursquare for a specific city
  async seedCity(city: string, customCategories?: Record<string, string>) {
    const nomadlyCategories = Object.values(NOMADLY_CATEGORIES).reduce(
      (acc, group) => {
        acc[group.label] = group.ids.join(",");
        return acc;
      },
      {} as Record<string, string>
    );

    // Use custom categories if provided, otherwise use Nomadly defaults
    const categories = customCategories || nomadlyCategories;

    for (const [categoryName, categoryId] of Object.entries(categories)) {
      try {
        const venues = await this.getVenues(city, categoryId, 50);

        for (const venue of venues) {
          await this.storeVenue(venue, city);
        }

        // Rate limiting
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.error(` Error fetching ${categoryName}:`, error);
      }
    }
  }

  // Store a single venue in the database
  private async storeVenue(venue: FoursquareVenue, city: string) {
    try {
      const poi = {
        id: `fs_${venue.fsq_place_id}`,
        name: venue.name,
        city: city,
        district: venue.location.locality || venue.location.city,
        tags: this.enhanceTags(venue.categories),
        cuisine: this.extractCuisine(venue.categories),
        priceBand: this.mapPrice(venue.price),
        popularity: venue.popularity || 0,
        iconic: Boolean(venue.rating && venue.rating > 8), // High-rated venues are iconic
        lat: venue.location.latitude, // Updated field name
        lng: venue.location.longitude, // Updated field name
        addressEn:
          venue.location.address ||
          `${venue.location.latitude}, ${venue.location.longitude}`,
        mode: "location_aware" as PoiMode, // Default mode - should be overridden by user preferences
      };

      // Use upsert to avoid duplicates
      await prisma.poi.upsert({
        where: { id: poi.id },
        update: {
          name: poi.name,
          city: poi.city,
          district: poi.district,
          tags: poi.tags,
          cuisine: poi.cuisine,
          priceBand: poi.priceBand,
          popularity: poi.popularity,
          iconic: poi.iconic,
          lat: poi.lat,
          lng: poi.lng,
          addressEn: poi.addressEn,
          mode: poi.mode as PoiMode,
        },
        create: poi,
      });
    } catch (error) {
      console.error(`Error storing venue ${venue.name}:`, error);
    }
  }

  // Helper methods
  private enhanceTags(
    categories: Array<{ name: string; id: string }>
  ): string[] {
    const tags: string[] = [];

    // Add category names
    categories.forEach((cat) => {
      tags.push(cat.name.toLowerCase());
    });

    // Add Nomadly category group labels
    categories.forEach((cat) => {
      const group = getCategoryGroup(cat.id);
      if (group) {
        tags.push(group);
      }
    });

    return [...new Set(tags)]; // Remove duplicates
  }

  private extractCuisine(categories: Array<{ name: string }>): string[] {
    return categories
      .filter(
        (cat) =>
          cat.name.toLowerCase().includes("restaurant") ||
          cat.name.toLowerCase().includes("food") ||
          cat.name.toLowerCase().includes("cafe")
      )
      .map((cat) => cat.name.toLowerCase());
  }

  private mapPrice(price?: number): MoneyBand | null {
    if (!price) return null;

    switch (price) {
      case 1:
        return "dollar"; // $
      case 2:
        return "dollarDollar"; // $$
      case 3:
        return "dollarDollarDollar"; // $$$
      case 4:
        return "dollarDollarDollar"; // $$$$
      default:
        return null;
    }
  }
}

// Simple function to seed a single city
export async function seedCityWithFoursquare(city: string) {
  const seeder = new FoursquareSeeder();
  await seeder.seedCity(city);
}
