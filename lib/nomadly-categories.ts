/**
 * Nomadly Foursquare Category Map
 * Curated for digital nomads: mixes productivity, culture, food, and leisure.
 */

export const NOMADLY_CATEGORIES = {
  work: {
    label: "Work & Productivity",
    ids: [
      "4bf58dd8d48988d16d941735", // Café
      "4bf58dd8d48988d1e0931735", // Coffee Shop
      "4bf58dd8d48988d174941735", // Coworking Space
      "4bf58dd8d48988d12f941735", // Library
    ],
  },

  food: {
    label: "Food & Coffee Culture",
    ids: [
      "4d4b7105d754a06374d81259", // Restaurant
      "56aa371be4b08b9a8d57355c", // Street Food
      "4bf58dd8d48988d1d0941735", // Dessert Shop
      "4bf58dd8d48988d1e0931735", // Coffee Shop
      "4bf58dd8d48988d1d3941735", // Vegetarian/Vegan Restaurant
    ],
  },

  outdoors: {
    label: "Outdoors & Scenic",
    ids: [
      "4bf58dd8d48988d163941735", // Park
      "4bf58dd8d48988d165941735", // Scenic Lookout
      "4bf58dd8d48988d1e2941735", // Beach
      "4bf58dd8d48988d159941735", // Trail
      "4bf58dd8d48988d15a941735", // Garden
    ],
  },

  culture: {
    label: "Culture & Learning",
    ids: [
      "4bf58dd8d48988d181941735", // Museum
      "4bf58dd8d48988d1e2931735", // Art Gallery
      "4deefb944765f83613cdba6e", // Historic Site
      "4bf58dd8d48988d12d941735", // Monument / Landmark
    ],
  },

  nightlife: {
    label: "Nightlife & Social",
    ids: [
      "4bf58dd8d48988d116941735", // Bar
      "4bf58dd8d48988d11b941735", // Pub
      "4bf58dd8d48988d11f941735", // Nightclub
      "4bf58dd8d48988d121941735", // Lounge
      "5f2c8c60a35e6e5a27f0d7ac", // Speakeasy
    ],
  },

  shopping: {
    label: "Shopping & Lifestyle",
    ids: [
      "4bf58dd8d48988d1fd941735", // Shopping Mall
      "50be8ee891d4fa8dcc7199a7", // Market
      "4bf58dd8d48988d114951735", // Bookstore
      "4bf58dd8d48988d101951735", // Boutique
    ],
  },

  wellness: {
    label: "Wellness & Fitness",
    ids: [
      "4bf58dd8d48988d175941735", // Gym / Fitness Center
      "4bf58dd8d48988d102941735", // Yoga Studio
      "4bf58dd8d48988d1ed941735", // Spa
    ],
  },

  // Additional categories for comprehensive coverage
  entertainment: {
    label: "Entertainment & Events",
    ids: [
      "4bf58dd8d48988d1e2931735", // Art Gallery
      "4bf58dd8d48988d1f2931735", // Theater
      "4bf58dd8d48988d1e5931735", // Concert Hall
      "4bf58dd8d48988d1e6931735", // Comedy Club
      "4bf58dd8d48988d1e7931735", // Movie Theater
    ],
  },

  transport: {
    label: "Transportation Hubs",
    ids: [
      "4bf58dd8d48988d1fa941735", // Airport
      "4bf58dd8d48988d1fb941735", // Train Station
      "4bf58dd8d48988d1fc941735", // Bus Station
      "4bf58dd8d48988d1fd941735", // Metro Station
    ],
  },

  services: {
    label: "Essential Services",
    ids: [
      "4bf58dd8d48988d1fe941735", // Bank
      "4bf58dd8d48988d1ff941735", // ATM
      "4bf58dd8d48988d200941735", // Pharmacy
      "4bf58dd8d48988d201941735", // Post Office
      "4bf58dd8d48988d202941735", // Internet Cafe
    ],
  },
};

/**
 * Get all category IDs in one flat array
 */
export function getAllCategoryIds(): string[] {
  return Object.values(NOMADLY_CATEGORIES)
    .map((group) => group.ids)
    .flat();
}

/**
 * Get category IDs for specific nomad needs
 */
export function getCategoryIdsForNomads(needs: string[]): string[] {
  const selectedIds: string[] = [];

  for (const need of needs) {
    if (NOMADLY_CATEGORIES[need as keyof typeof NOMADLY_CATEGORIES]) {
      selectedIds.push(
        ...NOMADLY_CATEGORIES[need as keyof typeof NOMADLY_CATEGORIES].ids
      );
    }
  }

  return selectedIds;
}

/**
 * Return a label for a given category ID
 */
export function getCategoryLabel(categoryId: string): string | null {
  for (const [key, group] of Object.entries(NOMADLY_CATEGORIES)) {
    if (group.ids.includes(categoryId)) return group.label;
  }
  return null;
}

/**
 * Get category group for a given category ID
 */
export function getCategoryGroup(categoryId: string): string | null {
  for (const [key, group] of Object.entries(NOMADLY_CATEGORIES)) {
    if (group.ids.includes(categoryId)) return key;
  }
  return null;
}

/**
 * Get all available category groups
 */
export function getAvailableCategoryGroups(): string[] {
  return Object.keys(NOMADLY_CATEGORIES);
}

/**
 * Get category info for display
 */
export function getCategoryInfo() {
  return Object.entries(NOMADLY_CATEGORIES).map(([key, group]) => ({
    key,
    label: group.label,
    count: group.ids.length,
    ids: group.ids,
  }));
}
