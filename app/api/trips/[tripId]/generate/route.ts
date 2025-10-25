import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  generateDayItinerary,
  generatePoiSuggestions,
  validateAndClampDayItinerary,
  type DayContext,
  type CandidatePOI,
} from "@/lib/ai-agent";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const { tripId } = await params;
    const body = await request.json();
    const {
      dayNumber,
      interests = [],
      budget,
      travelStyle,
      areaFocus,
      poiMode = "location_aware",
    } = body;

    // Get trip details
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: { user: true },
    });

    if (!trip || !trip.city) {
      return NextResponse.json(
        { error: "Trip not found or city not set" },
        { status: 404 }
      );
    }

    // Get POIs for the destination
    const pois = await prisma.poi.findMany({
      where: {
        city: trip.city,
        ...(areaFocus && areaFocus.length > 0
          ? { district: { in: areaFocus } }
          : {}),
      },
      take: 100, // Get top 100 POIs for the AI to choose from
    });

    if (pois.length === 0) {
      return NextResponse.json(
        {
          error: "No POIs found for this destination. Please seed POIs first.",
        },
        { status: 404 }
      );
    }

    // Convert POIs to candidate format
    const candidatePOIs: CandidatePOI[] = pois.map((poi) => ({
      id: poi.id,
      name: poi.name,
      district: poi.district || undefined,
      tags: poi.tags,
      mode: poi.mode as "location_aware" | "activity_focused",
    }));

    // Step 1: Get POI recommendations from AI
    const poiRecommendations = await generatePoiSuggestions(
      trip.city,

      candidatePOIs,
      areaFocus,
      poiMode as "location_aware" | "activity_focused"
    );

    // Filter to only recommended POIs
    const recommendedPOIs = candidatePOIs.filter((poi) =>
      poiRecommendations.recommendedPOIs.includes(poi.id)
    );

    // Step 2: Generate day itinerary
    const dayContext: DayContext = {
      destination: trip.city,
      dayNumber: dayNumber || 1,
      interests,
      budget,
      travelStyle,
    };

    const rawItinerary = await generateDayItinerary(
      dayContext,
      recommendedPOIs,
      [] // No fixed windows for now
    );

    // Step 3: Validate and clamp the result
    const validPOIIds = recommendedPOIs.map((poi) => poi.id);
    const validatedItinerary = validateAndClampDayItinerary(
      rawItinerary,
      validPOIIds,
      6 // Max 6 items per day
    );

    // Step 4: Save the generated itinerary (optional)
    // You might want to save this to the database

    return NextResponse.json({
      success: true,
      itinerary: validatedItinerary,
      poiRecommendations: {
        reasoning: poiRecommendations.reasoning,
        totalRecommended: poiRecommendations.recommendedPOIs.length,
      },
      metadata: {
        destination: trip.city,
        dayNumber: dayContext.dayNumber,
        totalPOIsAvailable: pois.length,
        totalPOIsRecommended: recommendedPOIs.length,
      },
    });
  } catch (error) {
    console.error("Generate trip error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate trip itinerary",
      },
      { status: 500 }
    );
  }
}
