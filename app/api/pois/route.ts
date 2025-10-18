import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Usage: /api/pois?city=Tokyo
export async function GET(request: NextRequest) {
  try {
    const city = request.nextUrl.searchParams.get("city");
    if (!city) {
      return NextResponse.json({ error: "City is required" }, { status: 400 });
    }
    const pois = await prisma.poi.findMany({
      where: { city },
      orderBy: { popularity: "desc" },
    });
    return NextResponse.json(pois, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to get pois" }, { status: 500 });
  }
}
