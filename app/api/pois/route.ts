import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { poiQuerySchema } from "@/lib/validations";

// Usage: /api/pois?city=Tokyo
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const validationResult = poiQuerySchema.safeParse(searchParams);
    if (!validationResult.success) {
      return NextResponse.json({ error: "Invalid query parameters" }, { status: 400 });
    }
    const { city, district, tag, query, limit, cursor } = validationResult.data;

    // Build where clause
    const where: any = { city };
    if (district) {
      where.district = district;
    }
    if (tag) {
      where.tags = {
        has: tag,
      };
    }
    if (query) {
      where.name = {
        contains: query,
        mode: "insensitive",
      };
    }
    // Build query with pagination
    const queryOptions: any = {where, orderBy: { popularity: "desc" }, take: limit}
    if (cursor) {
      queryOptions.cursor = { id: cursor };
      queryOptions.skip = 1;
    }
    const pois = await prisma.poi.findMany(queryOptions);
    return NextResponse.json(pois, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to get pois" }, { status: 500 });
  }
}
