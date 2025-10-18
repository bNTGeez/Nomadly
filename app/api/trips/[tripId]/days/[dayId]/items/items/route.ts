import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Create a new agenda item on a day
export async function POST(
  request: NextRequest,
  { params }: { params: { tripId: string; dayId: string } }
) {
  try {
    const { dayId } = params;
    const day = await prisma.tripDay.findUnique({ where: { id: dayId } });
    if (!day)
      return NextResponse.json({ error: "Day not found" }, { status: 404 });

    const body = await request.json();
    const {
      poiId,
      startAt,
      endAt,
      mode,
      locked = false,
    } = body as {
      poiId: string;
      startAt: string;
      endAt: string;
      mode: "location_aware" | "activity_focused";
      locked?: boolean;
    };
    if (!poiId || !startAt || !endAt || !mode) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const item = await prisma.agendaItem.create({
      data: {
        dayId,
        poiId,
        startAt: new Date(startAt),
        endAt: new Date(endAt),
        mode,
        locked,
      },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create item" },
      { status: 500 }
    );
  }
}
