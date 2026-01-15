import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import {
  authLimiter,
  authHourlyLimiter,
  retryAfterSeconds,
} from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") ?? "unknown";

    // Rate limiting with error handling
    try {
      const [r1, r2] = await Promise.all([
        authLimiter.limit(`auth:m:${ip}:register`),
        authHourlyLimiter.limit(`auth:h:${ip}:register`),
      ]);
      if (!r1.success || !r2.success) {
        const reset = !r1.success ? r1.reset : r2.reset;
        return NextResponse.json(
          { error: "Too many attempts. Try again soon." },
          { status: 429, headers: { "Retry-After": retryAfterSeconds(reset) } }
        );
      }
    } catch (rateLimitError) {
      console.error("Rate limiting error (continuing anyway):", rateLimitError);
      // Continue without rate limiting if Redis is unavailable (for development)
      if (process.env.NODE_ENV === "production") {
        throw rateLimitError;
      }
    }
    const { email, username, password, name } = await request.json();

    // Validate required fields
    if (!email || !username || !password || !name) {
      return NextResponse.json(
        { error: "Email, username, and password are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email or username already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        name: name,
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      { message: "User created successfully", user },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("Error details:", { errorMessage, errorStack, error });

    // Return more detailed error in development, generic in production
    return NextResponse.json(
      {
        error: "Failed to create user",
        ...(process.env.NODE_ENV === "development" && {
          details: errorMessage,
          stack: errorStack,
        }),
      },
      { status: 500 }
    );
  }
}
