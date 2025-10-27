import { Pace } from "@/app/generated/prisma";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { DateTime } from "luxon";
import { createTripSchema, type CreateTripInput } from "@/lib/validations";
import {
  handleValidationError,
  createErrorResponse,
  createSuccessResponse,
} from "@/lib/validation-utils";
import { auth } from "@/lib/auth";

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

export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse("Authentication required", 401);
    }

    // Get all trips for the user
    const trips = await prisma.trip.findMany({
      where: { userId: session.user.id },
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
}

export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse("Authentication required", 401);
    }

    const body = await request.json();

    // Validate input with Zod (using authenticated user's ID)
    const validationResult = createTripSchema.safeParse({
      ...body,
      userId: session.user.id,
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
}
