import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Zod schemas for structured output
const ItineraryItemSchema = z.object({
  poiId: z.string().describe("The ID of the POI to visit"),
  durationMinutes: z
    .number()
    .min(20)
    .max(240)
    .describe("Duration in minutes (20-240)"),
  isMeal: z.boolean().describe("Whether this is a meal/restaurant"),
  notes: z.string().optional().describe("Optional notes about this visit"),
});

const DayItinerarySchema = z.object({
  items: z
    .array(ItineraryItemSchema)
    .max(6)
    .describe("Ordered list of itinerary items for this day (max 6)"),
  reasoning: z.string().describe("Brief explanation of the day's choices"),
});

// Types for inputs
export interface DayContext {
  destination: string;
  dayNumber: number;
  interests: string[];
  budget?: string;
  travelStyle?: string;
}

export interface CandidatePOI {
  id: string;
  name: string;
  district?: string;
  tags: string[];
  mode: "location_aware" | "activity_focused";
  estimatedDuration?: number;
}

export interface FixedWindow {
  start: string; // Local time in HH:MM format
  end: string; // Local time in HH:MM format
  description: string;
}

export async function generateDayItinerary(
  dayContext: DayContext,
  candidatePOIs: CandidatePOI[],
  fixedWindows: FixedWindow[] = []
) {
  const { object } = await generateObject({
    model: openai("gpt-4o-mini"),
    temperature: 0.2,
    system: `You are Nomadly's day planner. You select and order POIs for a single day.

Your job:
1. Select 3-6 POIs from the candidate list for this day
2. Order them logically (considering location and flow)
3. Assign realistic durations (20-240 minutes per POI)
4. Mark meals/restaurants with isMeal: true
5. Balance must-see attractions with local experiences

Constraints:
- Only use POIs from the provided candidate list
- Fixed windows are for context only - you don't need to avoid them
- Consider travel time between locations
- Match traveler interests and budget
- Keep the day manageable (max 6 items)`,
    messages: [
      {
        role: "user",
        content: `Create an itinerary for Day ${dayContext.dayNumber} in ${
          dayContext.destination
        }.

Day Context:
- Day: ${dayContext.dayNumber}
- Interests: ${dayContext.interests.join(", ")}
${dayContext.budget ? `- Budget: ${dayContext.budget}` : ""}
${dayContext.travelStyle ? `- Travel Style: ${dayContext.travelStyle}` : ""}

Fixed Windows (for context - you don't need to avoid these):
${
  fixedWindows.length > 0
    ? fixedWindows
        .map((w) => `- ${w.start}-${w.end}: ${w.description}`)
        .join("\n")
    : "None"
}

Available POIs:
${candidatePOIs
  .map(
    (poi) =>
      `- ${poi.id}: ${poi.name} (${
        poi.district || "No district"
      }) - Tags: ${poi.tags.join(", ")}`
  )
  .join("\n")}

Select and order the best POIs for this day. Create a logical flow.`,
      },
    ],
    schema: DayItinerarySchema,
  });

  return object;
}

// Schema for POI recommendations
const POIRecommendationSchema = z.object({
  recommendedPOIs: z
    .array(z.string())
    .max(40)
    .describe("Array of POI IDs that match the criteria"),
  reasoning: z
    .string()
    .describe("Brief explanation of why these POIs were selected"),
});

export async function generatePoiSuggestions(
  destination: string,
  candidatePOIs: CandidatePOI[],
  areaFocus?: string[],
  poiMode: "location_aware" | "activity_focused" = "location_aware"
) {
  const { object } = await generateObject({
    model: openai("gpt-4o-mini"),
    temperature: 0.2,
    system: `You are Nomadly's POI recommendation engine. You select the most relevant POIs from a candidate list.

Your job:
1. Filter POIs based on location (areaFocus) or activity preferences
2. Select the top 30-40 most relevant POIs
3. Consider traveler interests, budget, and travel style
4. Prioritize must-see attractions and local gems

Mode: ${poiMode}
${
  poiMode === "location_aware"
    ? "Focus on POIs in specified areas/districts"
    : "Focus on POIs that match specific activities/interests"
}`,
    messages: [
      {
        role: "user",
        content: `Select the best POIs for ${destination}${
          areaFocus ? ` in these areas: ${areaFocus.join(", ")}` : ""
        }.

Available POIs:
${candidatePOIs
  .map(
    (poi) =>
      `- ${poi.id}: ${poi.name} (${
        poi.district || "No district"
      }) - Tags: ${poi.tags.join(", ")}`
  )
  .join("\n")}

Select the top 30-40 most relevant POIs and return their IDs.`,
      },
    ],
    schema: POIRecommendationSchema,
  });

  return object;
}

// Server-side validation and clamping
export function validateAndClampDayItinerary(
  rawResult: any,
  validPOIIds: string[],
  maxItems: number = 6
) {
  // Clamp and validate the result
  const clampedResult = {
    items: rawResult.items
      .slice(0, maxItems) // Cap items by pace
      .filter((item: any) => validPOIIds.includes(item.poiId)) // Drop unknown POI IDs
      .map((item: any) => ({
        ...item,
        durationMinutes: Math.max(20, Math.min(240, item.durationMinutes)), // Clamp duration
        isMeal: Boolean(item.isMeal), // Ensure boolean
      })),
    reasoning: rawResult.reasoning || "No reasoning provided",
  };

  return clampedResult;
}
