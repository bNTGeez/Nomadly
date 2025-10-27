import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    // Get the authenticated user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { tripId } = await params;

    // Verify trip belongs to user
    const trip = await prisma.trip.findUnique({
      where: {
        id: tripId,
        userId: session.user.id,
      },
      select: { id: true },
    });

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    // Get all days of the trip
    const tripDays = await prisma.tripDay.findMany({
      where: { tripId },
      orderBy: { dateLocal: "asc" },
      include: {
        items: {
          include: {
            poi: {
              select: {
                id: true,
                name: true,
                tags: true,
                cuisine: true,
                priceBand: true,
                iconic: true,
              },
            },
          },
          orderBy: { startAt: "asc" },
        },
      },
    });

    if (tripDays.length === 0) {
      return NextResponse.json({
        days: [],
        reasoning: "No itinerary items found for this trip.",
      });
    }

    // Transform the data to match the expected format
    const days = tripDays.map((tripDay) => ({
      id: tripDay.id,
      dateLocal: tripDay.dateLocal,
      items: tripDay.items.map((item) => ({
        poiId: item.poiId,
        durationMinutes: Math.round(
          (new Date(item.endAt).getTime() - new Date(item.startAt).getTime()) /
            (1000 * 60)
        ),
        isMeal: item.poi.cuisine && item.poi.cuisine.length > 0,
        notes: `Visit ${item.poi.name}${
          item.poi.iconic ? " (Iconic location)" : ""
        }`,
        startTime: new Date(item.startAt).toTimeString().slice(0, 5),
        endTime: new Date(item.endAt).toTimeString().slice(0, 5),
        poiName: item.poi.name,
      })),
    }));

    return NextResponse.json({
      days,
      reasoning: `Your personalized itinerary for ${tripDays.length} days, carefully planned based on your preferences and the local attractions.`,
    });
  } catch (error) {
    console.error("Failed to fetch itinerary:", error);
    return NextResponse.json(
      { error: "Failed to fetch itinerary" },
      { status: 500 }
    );
  }
}
