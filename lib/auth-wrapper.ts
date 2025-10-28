import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createErrorResponse } from "@/lib/validation-utils";

export type AuthenticatedRequest = NextRequest & {
  user: {
    id: string;
    email: string;
    name: string;
    username: string;
    createdAt: string;
  };
};

export type AuthenticatedHandler = (
  request: AuthenticatedRequest,
  context?: any
) => Promise<NextResponse>;

export function withAuth(handler: AuthenticatedHandler) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    try {
      // Get the authenticated user
      const session = await auth();
      if (!session?.user?.id) {
        return createErrorResponse("Authentication required", 401);
      }

      // Create authenticated request with user data
      const authenticatedRequest = request as AuthenticatedRequest;
      authenticatedRequest.user = {
        id: session.user.id,
        email: session.user.email!,
        name: session.user.name!,
        username: session.user.username!,
        createdAt: session.user.createdAt!,
      };

      // Call the original handler with authenticated request
      return await handler(authenticatedRequest, context);
    } catch (error) {
      console.error("Authentication error:", error);
      return createErrorResponse("Authentication failed", 401);
    }
  };
}

export function withAuthGET(handler: AuthenticatedHandler) {
  return withAuth(handler);
}

export function withAuthPOST(handler: AuthenticatedHandler) {
  return withAuth(handler);
}

export function withAuthPUT(handler: AuthenticatedHandler) {
  return withAuth(handler);
}

export function withAuthDELETE(handler: AuthenticatedHandler) {
  return withAuth(handler);
}
