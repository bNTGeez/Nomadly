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
    const days = await prisma.tripDay.findMany({
      where: { tripId },
      orderBy: { dateLocal: "asc" },
      include: {
        fixed: { orderBy: { startAt: "asc" } },
        items: { orderBy: { startAt: "asc" }, include: { poi: true } },
      },
    });
    return createSuccessResponse(days);
  } catch (error) {
    console.error("Failed to get days:", error);
    return createErrorResponse("Failed to get days");
  }
}
