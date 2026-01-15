import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { DateTime } from "luxon";
import { createTripSchema, type CreateTripInput } from "@/lib/validations";
import {
  handleValidationError,
  createErrorResponse,
  createSuccessResponse,
} from "@/lib/validation-utils";
import {
  withAuthGET,
  withAuthPOST,
  AuthenticatedRequest,
} from "@/lib/auth-wrapper";
import { generalLimiter, retryAfterSeconds } from "@/lib/rate-limit";

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

export const GET = withAuthGET(async (request: AuthenticatedRequest) => {
  try {
    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    const key = request.user?.id ? `trips:${request.user.id}` : `tripsip:${ip}`;
    try {
      const { success, reset } = await generalLimiter.limit(key);
      if (!success) {
        return NextResponse.json(
          { error: "Too many requests" },
          { status: 429, headers: { "Retry-After": retryAfterSeconds(reset) } }
        );
      }
    } catch (rateLimitError) {
      // If rate limiting fails (e.g., Redis unavailable), log and continue
      console.warn("Rate limiting failed, continuing without rate limit:", rateLimitError);
    }
    // Get all trips for the authenticated user
    const trips = await prisma.trip.findMany({
      where: { userId: request.user.id },
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
      orderBy: { createdAt: "desc" }, // Most recent first
    });

    return createSuccessResponse({ trips });
  } catch (error) {
    console.error("Failed to fetch trips:", error);
    return createErrorResponse("Failed to fetch trips");
  }
});

export const POST = withAuthPOST(async (request: AuthenticatedRequest) => {
  try {
    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    const key = request.user?.id ? `trips:${request.user.id}` : `tripsip:${ip}`;
    try {
      const { success, reset } = await generalLimiter.limit(key);
      if (!success) {
        return NextResponse.json(
          { error: "Too many requests" },
          { status: 429, headers: { "Retry-After": retryAfterSeconds(reset) } }
        );
      }
    } catch (rateLimitError) {
      // If rate limiting fails (e.g., Redis unavailable), log and continue
      console.warn("Rate limiting failed, continuing without rate limit:", rateLimitError);
    }
    const body = await request.json();

    // Validate input with Zod (using authenticated user's ID)
    const validationResult = createTripSchema.safeParse({
      ...body,
      userId: request.user.id,
    });
    if (!validationResult.success) {
      return handleValidationError(validationResult.error);
    }

    const validatedData: CreateTripInput = validationResult.data;
    const {
      userId: validatedUserId,
      title,
      city,
      destTz,
      startDate,
      endDate,
      pace,
      dayStart,
      dayEnd,
      budget,
      mealPlan,
      interests,
      cuisines,
    } = validatedData;
    const trip = await prisma.trip.create({
      data: {
        userId: validatedUserId,
        title,
        city,
        destTz,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        pace,
        dayStart,
        dayEnd,
        budget,
        mealPlan,
        interests,
        cuisines,
      },
    });

    const tz = destTz ?? "UTC";
    const days = eachDateAsUTC(startDate, endDate, tz).map((date) => ({
      tripId: trip.id,
      dateLocal: date,
    }));
    await prisma.tripDay.createMany({ data: days });

    return createSuccessResponse(trip, 201);
  } catch (error) {
    console.error("Failed to create trip:", error);

    // Handle specific Prisma errors
    if (error instanceof Error) {
      if (error.message.includes("Unique constraint")) {
        return createErrorResponse("Trip with this data already exists", 409);
      }
      if (error.message.includes("Foreign key constraint")) {
        return createErrorResponse("Invalid user ID", 400);
      }
    }

    return createErrorResponse("Failed to create trip");
  }
});
