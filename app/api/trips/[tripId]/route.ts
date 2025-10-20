import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  createErrorResponse,
  createSuccessResponse,
} from "@/lib/validation-utils";

export async function GET(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const { tripId } = params;
    // Validate tripId format
    if (!tripId || typeof tripId !== "string") {
      return createErrorResponse("Invalid trip ID", 400);
    }
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
              include: {
                poi: true,
              },
            },
          },
        },
      },
    });
    if (!trip) {
      return createErrorResponse("Trip not found", 404);
    }

    return createSuccessResponse(trip);
  } catch (error) {
    console.error("Failed to get trip:", error);
    return createErrorResponse("Failed to get trip");
  }
}
