import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  generateDayItinerary,
  generatePoiSuggestions,
  validateAndClampDayItinerary,
  type DayContext,
  type CandidatePOI,
} from "@/lib/ai-agent";
import { FoursquareSeeder } from "@/lib/foursquare-seeder";
import { parseTime, timeToMinutes, minutesToTime } from "@/lib/time-utils";
import { withAuthPOST, AuthenticatedRequest } from "@/lib/auth-wrapper";
import { aiLimiter, aiBurstLimiter, retryAfterSeconds } from "@/lib/rate-limit";

export const POST = withAuthPOST(
  async (
    request: AuthenticatedRequest,
    { params }: { params: Promise<{ tripId: string }> }
  ) => {
    try {
      const ip = request.headers.get("x-forwarded-for") ?? "unknown";
      const key = request.user?.id ? `ai:${request.user.id}` : `aiip:${ip}`;
      const [r1, r2] = await Promise.all([
        aiLimiter.limit(key),
        aiBurstLimiter.limit(`${key}:burst`),
      ]);
      if (!r1.success || !r2.success) {
        const reset = !r1.success ? r1.reset : r2.reset;
        return NextResponse.json(
          { error: "Rate limit exceeded. Try again soon." },
          { status: 429, headers: { "Retry-After": retryAfterSeconds(reset) } }
        );
      }
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

      // Get trip details and verify ownership
      const trip = await prisma.trip.findUnique({
        where: {
          id: tripId,
          userId: request.user.id, // Ensure user can only access their own trips
        },
        include: { user: true },
      });

      console.log("Trip found:", trip);
      console.log("Trip city:", trip?.city);

      if (!trip) {
        return NextResponse.json({ error: "Trip not found" }, { status: 404 });
      }

      if (!trip.city) {
        return NextResponse.json(
          { error: "City not set for this trip" },
          { status: 400 }
        );
      }

      // Get POIs for the destination
      let pois = await prisma.poi.findMany({
        where: {
          city: trip.city,
          ...(areaFocus && areaFocus.length > 0
            ? { district: { in: areaFocus } }
            : {}),
        },
        take: 100, // Get top 100 POIs for the AI to choose from
      });

      console.log(`Found ${pois.length} POIs for city: ${trip.city}`);

      // If no POIs found, try to seed them from Foursquare
      if (pois.length === 0) {
        console.log(
          `No POIs found for ${trip.city}, attempting to seed from Foursquare...`
        );

        try {
          const seeder = new FoursquareSeeder();
          await seeder.seedCity(trip.city);

          // Fetch POIs again after seeding
          pois = await prisma.poi.findMany({
            where: {
              city: trip.city,
              ...(areaFocus && areaFocus.length > 0
                ? { district: { in: areaFocus } }
                : {}),
            },
            take: 100,
          });

          console.log(
            `Successfully seeded ${pois.length} POIs for ${trip.city}`
          );

          if (pois.length === 0) {
            return NextResponse.json(
              {
                error: `No POIs found for ${trip.city} even after seeding. The city might not be supported by Foursquare.`,
              },
              { status: 404 }
            );
          }
        } catch (error) {
          console.error(`Failed to seed POIs for ${trip.city}:`, error);
          return NextResponse.json(
            {
              error: `Failed to fetch POIs for ${trip.city}. Please try a different destination.`,
            },
            { status: 500 }
          );
        }
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

      // Step 4: Save the generated itinerary to the database for each day
      const tripDays = await prisma.tripDay.findMany({
        where: { tripId },
        orderBy: { dateLocal: "asc" },
      });

      if (tripDays.length > 0) {
        // Clear existing items for all days
        await prisma.agendaItem.deleteMany({
          where: { dayId: { in: tripDays.map((day) => day.id) } },
        });

        // Track POIs already used across all days to avoid duplicates
        const usedPOIIds = new Set<string>();

        // Generate itinerary for each day
        for (const tripDay of tripDays) {
          const dayNumber = tripDays.indexOf(tripDay) + 1;
          const availablePOIs = recommendedPOIs.filter(
            (poi) => !usedPOIIds.has(poi.id)
          );
          const finalPOIs =
            availablePOIs.length >= 6
              ? availablePOIs
              : [
                  ...availablePOIs,
                  ...recommendedPOIs.filter((poi) => usedPOIIds.has(poi.id)),
                ];

          console.log(
            `Day ${dayNumber}: ${availablePOIs.length} new POIs available, ${usedPOIIds.size} already used`
          );

          // Generate a fresh itinerary for this specific day
          const dayContext: DayContext = {
            destination: trip.city,
            dayNumber: tripDays.indexOf(tripDay) + 1,
            interests,
            budget,
            travelStyle,
          };

          const rawDayItinerary = await generateDayItinerary(
            dayContext,
            finalPOIs,
            [] // No fixed windows for now
          );

          // Validate and clamp the result for this day
          const validPOIIds = recommendedPOIs.map((poi) => poi.id);
          const validatedDayItinerary = validateAndClampDayItinerary(
            rawDayItinerary,
            validPOIIds,
            6 // Max 6 items per day
          );

          // Track which POIs were used in this day's itinerary
          validatedDayItinerary.items.forEach((item: any) => {
            usedPOIIds.add(item.poiId);
          });

          // Save itinerary items for this day
          const agendaItems = validatedDayItinerary.items
            .map((item: any, index: number) => {
              const poi = recommendedPOIs.find((p) => p.id === item.poiId);
              if (!poi) return null;

              // Parse the trip's day start time (e.g., "09:30")
              const { hour: dayStartHour, minute: dayStartMinute } = parseTime(
                trip.dayStart
              );

              // Calculate start and end times based on day start time and duration
              const startMinutes = index * (item.durationMinutes + 30); // 30 min buffer
              const totalStartMinutes =
                timeToMinutes(dayStartHour, dayStartMinute) + startMinutes;
              const { hour: startHour, minute: startMin } =
                minutesToTime(totalStartMinutes);

              const startAt = new Date(tripDay.dateLocal);
              startAt.setHours(startHour, startMin, 0, 0);

              const endAt = new Date(startAt);
              endAt.setMinutes(endAt.getMinutes() + item.durationMinutes);

              return {
                dayId: tripDay.id,
                poiId: item.poiId,
                startAt: startAt.toISOString(),
                endAt: endAt.toISOString(),
                mode: poiMode as "location_aware" | "activity_focused",
              };
            })
            .filter(Boolean);

          if (agendaItems.length > 0) {
            await prisma.agendaItem.createMany({
              data: agendaItems,
            });
          }
        }
      }

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
);
