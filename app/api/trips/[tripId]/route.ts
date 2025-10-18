import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const { tripId } = params;
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        days: {
          orderBy: {
            dateLocal: "asc",
          },
          include: {
            fixed: {
              orderBy: {
                startAt: "asc",
              },
            },
            items: {
              orderBy: {
                startAt: "asc",
              },
            },
          },
        },
      },
    });
    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }
    return NextResponse.json(trip, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to get trip" }, { status: 500 });
  }
}
