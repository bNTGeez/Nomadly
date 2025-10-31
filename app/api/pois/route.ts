import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { poiQuerySchema } from "@/lib/validations";
import { searchLimiter, retryAfterSeconds } from "@/lib/rate-limit";
import { handleValidationError } from "@/lib/validation-utils";

// Usage: /api/pois?city=Tokyo
export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    const { success, reset } = await searchLimiter.limit(`search:${ip}:pois`);
    if (!success) {
      const headers = new Headers();
      headers.set("Retry-After", retryAfterSeconds(reset));
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers }
      );
    }
    const searchParams = request.nextUrl.searchParams;
    const paramsObj = Object.fromEntries(searchParams.entries());
    const validationResult = poiQuerySchema.safeParse(paramsObj);
    if (!validationResult.success) {
      return handleValidationError(validationResult.error);
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
    const queryOptions: any = {
      where,
      orderBy: { popularity: "desc" },
      take: limit,
    };
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
