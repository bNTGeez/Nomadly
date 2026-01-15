import { NextRequest, NextResponse } from "next/server";
import { searchLimiter, retryAfterSeconds } from "@/lib/rate-limit";

// Types for Geoapify API response
interface GeoapifyFeature {
  type: "Feature";
  properties: {
    country: string;
    country_code: string;
    region?: string;
    state?: string;
    city?: string;
    formatted: string;
    address_line1: string;
    address_line2: string;
    category: string;
    result_type: string;
    lon: number;
    lat: number;
    place_id: string;
    rank: {
      importance: number;
      confidence: number;
      confidence_city_level?: number;
      match_type: string;
    };
    timezone?: {
      name: string;
      offset_STD: string;
      offset_STD_seconds: number;
      abbreviation_STD: string;
    };
  };
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
}

interface GeoapifyResponse {
  type: "FeatureCollection";
  features: GeoapifyFeature[];
  query: {
    text: string;
    parsed: {
      city?: string;
      expected_type: string;
    };
    categories: string[];
  };
}

export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    try {
      const { success, reset } = await searchLimiter.limit(
        `search:${ip}:autocomplete`
      );
      if (!success) {
        const headers = new Headers();
        headers.set("Retry-After", retryAfterSeconds(reset));
        return NextResponse.json(
          { error: "Too many requests" },
          { status: 429, headers }
        );
      }
    } catch (rateLimitError) {
      // If rate limiting fails (e.g., Redis unavailable), log and continue
      console.warn(
        "Rate limiting failed, continuing without rate limit:",
        rateLimitError
      );
    }
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        {
          error:
            "Query parameter 'q' is required and must be at least 2 characters",
        },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEOAPIFY_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Geoapify API key not configured" },
        { status: 500 }
      );
    }

    // Call Geoapify API
    const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(
      query
    )}&apiKey=${apiKey}&limit=10&type=city`;

    console.log("Calling Geoapify API with URL:", url.replace(apiKey, "***"));

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Geoapify API error response:", errorText);
      throw new Error(
        `Geoapify API error: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const data: GeoapifyResponse = await response.json();

    // Transform the response to a cleaner format
    const suggestions = data.features.map((feature) => ({
      id: feature.properties.place_id,
      formatted: feature.properties.formatted,
      city: feature.properties.city || feature.properties.address_line1,
      country: feature.properties.country,
      countryCode: feature.properties.country_code,
      coordinates: {
        lat: feature.properties.lat,
        lng: feature.properties.lon,
      },
      timezone: feature.properties.timezone?.name,
      confidence: feature.properties.rank.confidence,
      importance: feature.properties.rank.importance,
      resultType: feature.properties.result_type,
    }));

    return NextResponse.json({
      suggestions,
      query: data.query?.text || query,
    });
  } catch (error) {
    console.error("Geoapify autocomplete error:", error);
    return NextResponse.json(
      { error: "Failed to fetch location suggestions" },
      { status: 500 }
    );
  }
}
