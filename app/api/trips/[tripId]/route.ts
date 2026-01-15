import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  withAuthGET,
  withAuthDELETE,
  AuthenticatedRequest,
} from "@/lib/auth-wrapper";
import { generalLimiter, retryAfterSeconds } from "@/lib/rate-limit";
import {
  createErrorResponse,
  createSuccessResponse,
} from "@/lib/validation-utils";

export const GET = withAuthGET(
  async (
    request: AuthenticatedRequest,
    { params }: { params: Promise<{ tripId: string }> }
  ) => {
    try {
      const ip = request.headers.get("x-forwarded-for") ?? "unknown";
      const key = request.user?.id
        ? `trips:${request.user.id}`
        : `tripsip:${ip}`;
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
      const { tripId } = await params;

      // Get trip details
      const trip = await prisma.trip.findUnique({
        where: {
          id: tripId,
          userId: request.user.id, // Ensure user can only access their own trips
        },
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
      });

      if (!trip) {
        return NextResponse.json({ error: "Trip not found" }, { status: 404 });
      }

      return NextResponse.json(trip);
    } catch (error) {
      console.error("Failed to fetch trip:", error);
      return NextResponse.json(
        { error: "Failed to fetch trip" },
        { status: 500 }
      );
    }
  }
);

export const DELETE = withAuthDELETE(
  async (
    request: AuthenticatedRequest,
    { params }: { params: Promise<{ tripId: string }> }
  ) => {
    try {
      const ip = request.headers.get("x-forwarded-for") ?? "unknown";
      const key = request.user?.id
        ? `trips:${request.user.id}`
        : `tripsip:${ip}`;
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
      const { tripId } = await params;

      // First verify the trip exists and belongs to the user
      const trip = await prisma.trip.findUnique({
        where: {
          id: tripId,
          userId: request.user.id,
        },
        select: { id: true },
      });

      if (!trip) {
        return createErrorResponse("Trip not found", 404);
      }

      // Delete the trip
      await prisma.trip.delete({
        where: { id: tripId },
      });

      return createSuccessResponse({ message: "Trip deleted successfully" });
    } catch (error) {
      console.error("Failed to delete trip:", error);
      return createErrorResponse("Failed to delete trip");
    }
  }
);
