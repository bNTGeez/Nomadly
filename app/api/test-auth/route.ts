import { withAuthGET, AuthenticatedRequest } from "@/lib/auth-wrapper";
import { NextResponse } from "next/server";

/**
 * Test API route to verify authentication wrapper is working
 *
 * Usage:
 * - Without auth: curl http://localhost:3000/api/test-auth
 *   Expected: 401 "Authentication required"
 *
 * - With auth: curl http://localhost:3000/api/test-auth (with session cookie)
 *   Expected: 200 with user data
 */
export const GET = withAuthGET(async (request: AuthenticatedRequest) => {
  console.log("🔐 Authentication test - User authenticated:", request.user);

  return NextResponse.json({
    success: true,
    message: "Authentication wrapper is working!",
    user: {
      id: request.user.id,
      email: request.user.email,
      name: request.user.name,
      username: request.user.username,
    },
    timestamp: new Date().toISOString(),
    debug: {
      hasUserId: !!request.user.id,
      hasEmail: !!request.user.email,
      hasName: !!request.user.name,
    },
  });
});
