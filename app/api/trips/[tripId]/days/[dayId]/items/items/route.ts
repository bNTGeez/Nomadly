import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  createAgendaItemSchema,
  type CreateAgendaItemInput,
} from "@/lib/validations";
import {
  handleValidationError,
  createErrorResponse,
  createSuccessResponse,
} from "@/lib/validation-utils";

// Create a new agenda item on a day
export async function POST(
  request: NextRequest,
  { params }: { params: { tripId: string; dayId: string } }
) {
  try {
    const { dayId } = params;
    // Validate dayId format
    if (!dayId || typeof dayId !== "string") {
      return createErrorResponse("Invalid day ID", 400);
    }
    const day = await prisma.tripDay.findUnique({ where: { id: dayId } });
    if (!day) {
      return createErrorResponse("Day not found", 404);
    }

    const body = await request.json();
    const validationResult = createAgendaItemSchema.safeParse(body);
    if (!validationResult.success) {
      return handleValidationError(validationResult.error);
    }

    const validatedData: CreateAgendaItemInput = validationResult.data;
    const { poiId, startAt, endAt, mode, locked } = validatedData;
    const poi = await prisma.poi.findUnique({ where: { id: poiId } });
    if (!poi) {
      return createErrorResponse("POI not found", 404);
    }

    // check time conflicts with existing items
    const conflictingItems = await prisma.agendaItem.findMany({
      where: {
        dayId,
        startAt: { lte: new Date(endAt) },
        endAt: { gte: new Date(startAt) },
      },
    });
    if (conflictingItems.length > 0) {
      return createErrorResponse(
        "Time conflict with existing agenda item",
        409
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
    return createSuccessResponse(item, 201);
  } catch (error) {
    console.error("Failed to create agenda item:", error);

    // Handle specific Prisma errors
    if (error instanceof Error) {
      if (error.message.includes("Foreign key constraint")) {
        return createErrorResponse("Invalid POI or day reference", 400);
      }
    }

    return createErrorResponse("Failed to create agenda item");
  }
}
