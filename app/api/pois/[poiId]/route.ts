import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ poiId: string }> }
) {
  try {
    const { poiId } = await params;

    const poi = await prisma.poi.findUnique({
      where: { id: poiId },
      select: {
        id: true,
        name: true,
        district: true,
        tags: true,
        cuisine: true,
        priceBand: true,
        iconic: true,
      },
    });

    if (!poi) {
      return NextResponse.json({ error: "POI not found" }, { status: 404 });
    }

    return NextResponse.json(poi);
  } catch (error) {
    console.error("Error fetching POI:", error);
    return NextResponse.json({ error: "Failed to fetch POI" }, { status: 500 });
  }
}
