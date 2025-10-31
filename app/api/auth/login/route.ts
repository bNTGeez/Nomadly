import { NextRequest, NextResponse } from "next/server";
import { signIn } from "@/lib/auth";
import {
  authLimiter,
  authHourlyLimiter,
  retryAfterSeconds,
} from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    const [r1, r2] = await Promise.all([
      authLimiter.limit(`auth:m:${ip}:login`),
      authHourlyLimiter.limit(`auth:h:${ip}:login`),
    ]);
    if (!r1.success || !r2.success) {
      const reset = !r1.success ? r1.reset : r2.reset;
      return NextResponse.json(
        { error: "Too many attempts. Try again soon." },
        { status: 429, headers: { "Retry-After": retryAfterSeconds(reset) } }
      );
    }
    const body = await request.json();
    const { email, password } = body;

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
