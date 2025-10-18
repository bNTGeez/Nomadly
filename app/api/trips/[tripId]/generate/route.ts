import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// TODO: Implement this
export async function POST(request: NextRequest, { params }: { params: { tripId: string } }) {
  try {
    const { tripId } = params;
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to generate trip" }, { status: 500 });
  }
}