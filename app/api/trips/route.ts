import { Pace } from "@/app/generated/prisma";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { DateTime } from "luxon";

function eachDateAsUTC(startISO: string, endISO: string, tz: string) {
  const start = DateTime.fromISO(startISO, { zone: tz }).startOf("day");
  const end = DateTime.fromISO(endISO, { zone: tz }).startOf("day");
  if (!start.isValid || !end.isValid || end < start)
    throw new Error("bad input");

  const out: Date[] = [];
  for (let d = start; d <= end; d = d.plus({ days: 1 })) {
    out.push(d.toUTC().toJSDate());
  }
  return out;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      title,
      city,
      destTz,
      startDate,
      endDate,
      pace = Pace.normal,
      dayStart = "09:30",
      dayEnd = "20:30",
      interests = { selected: [] },
      cuisines = [],
    } = body;
    if (!userId || !title || !city || !destTz || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    const trip = await prisma.trip.create({
      data: {
        userId,
        title,
        city,
        destTz,
        startDate,
        endDate,
        pace,
        dayStart,
        dayEnd,
        interests,
        cuisines,
      },
    });

    const tz = destTz ?? "UTC";
    const days = eachDateAsUTC(startDate as string, endDate as string, tz).map(
      (date) => ({
        tripId: trip.id,
        dateLocal: date,
      })
    );
    await prisma.tripDay.createMany({ data: days });
    return NextResponse.json(trip, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create trip" },
      { status: 500 }
    );
  }
}
