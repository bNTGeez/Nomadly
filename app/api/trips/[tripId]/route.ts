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

    // Get trip details
    const trip = await prisma.trip.findUnique({
      where: {
        id: tripId,
        userId: session.user.id, // Ensure user can only access their own trips
      },
      select: {
        id: true,
        title: true,
        city: true,
        startDate: true,
        endDate: true,
        dayStart: true,
        dayEnd: true,
        budget: true,
        interests: true,
        createdAt: true,
      },
    });

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    return NextResponse.json(trip);
  } catch (error) {
    console.error("Failed to fetch trip:", error);
    return NextResponse.json(
      { error: "Failed to fetch trip" },
      { status: 500 }
    );
  }
}
