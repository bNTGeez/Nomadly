# Authentication Testing Guide

This guide shows you how to test that the authentication wrapper is working correctly.

## 1. Testing API Routes

### Test 1: Unauthenticated Request (Should Return 401)

```bash
# Test GET /api/trips without authentication
curl -X GET http://localhost:3000/api/trips

# Expected response:
# {"error": "Authentication required"}
# Status: 401
```

### Test 2: Authenticated Request (Should Return Data)

```bash
# First, you need to get a session token by logging in
# Then use the session cookie in your request

# Test GET /api/trips with authentication
curl -X GET http://localhost:3000/api/trips \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"

# Expected response:
# {"success": true, "data": {"trips": [...]}}
# Status: 200
```

### Test 3: Using Browser Developer Tools

1. Open your app in the browser
2. Open Developer Tools (F12)
3. Go to Network tab
4. Make a request to `/api/trips`
5. Check the response:
   - **Without login**: Should return 401 with "Authentication required"
   - **With login**: Should return 200 with trips data

## 2. Testing Client-Side Authentication

### Test Authentication Context

Add this temporary component to test the auth context:

```typescript
"use client";

import { useAuth } from "@/lib/auth-context";

export default function AuthTestComponent() {
  const { user, isLoading, isAuthenticated } = useAuth();

  return (
    <div className="p-4 border rounded">
      <h3>Authentication Test</h3>
      <p>Loading: {isLoading ? "Yes" : "No"}</p>
      <p>Authenticated: {isAuthenticated ? "Yes" : "No"}</p>
      {user && (
        <div>
          <p>User ID: {user.id}</p>
          <p>Email: {user.email}</p>
          <p>Name: {user.name}</p>
        </div>
      )}
    </div>
  );
}
```

## 3. Testing Authentication Wrapper Directly

### Create a Test API Route

Create `/app/api/test-auth/route.ts`:

```typescript
import { withAuthGET, AuthenticatedRequest } from "@/lib/auth-wrapper";
import { NextResponse } from "next/server";

export const GET = withAuthGET(async (request: AuthenticatedRequest) => {
  return NextResponse.json({
    message: "Authentication successful!",
    user: {
      id: request.user.id,
      email: request.user.email,
      name: request.user.name,
    },
    timestamp: new Date().toISOString(),
  });
});
```

Then test it:

- **Without auth**: `curl http://localhost:3000/api/test-auth` → Should return 401
- **With auth**: `curl http://localhost:3000/api/test-auth` (with session cookie) → Should return user data

## 4. Debugging Authentication State

### Add Debug Logging

Temporarily add console logs to see what's happening:

```typescript
// In your API route
export const GET = withAuthGET(async (request: AuthenticatedRequest) => {
  console.log("🔐 Authenticated user:", request.user);
  console.log("🔐 User ID:", request.user.id);

  // Your existing logic...
});
```

### Check Session in Browser

1. Open Developer Tools
2. Go to Application tab
3. Look under Cookies for `next-auth.session-token`
4. Check if the token exists and has a value

## 5. Common Issues and Solutions

### Issue: "Authentication required" even when logged in

**Possible causes:**

1. Session cookie not being sent
2. Session expired
3. Middleware not configured properly

**Solutions:**

1. Check if `next-auth.session-token` cookie exists
2. Verify middleware is properly configured
3. Check if session is valid in NextAuth

### Issue: User data is undefined

**Possible causes:**

1. Session callback not returning user data
2. JWT callback not storing user data

**Check your auth.ts:**

```typescript
callbacks: {
  async session({ session, token }) {
    if (token) {
      session.user.id = token.id as string;
      session.user.username = token.username as string;
      // Make sure all required fields are set
    }
    return session;
  },
  async jwt({ token, user }) {
    if (user) {
      token.id = user.id;
      token.username = user.username;
      // Make sure all required fields are stored
    }
    return token;
  },
}
```

## 6. Quick Test Checklist

- [ ] Unauthenticated API request returns 401
- [ ] Authenticated API request returns data
- [ ] `useAuth()` hook returns correct state
- [ ] `request.user.id` is available in API routes
- [ ] Session cookie exists when logged in
- [ ] User can only access their own data

## 7. Testing with Different Scenarios

### Test User Isolation

1. Create two different user accounts
2. Login as User A
3. Try to access User B's trips
4. Should return 404 or empty results

### Test Session Expiry

1. Login and make authenticated requests
2. Wait for session to expire (or manually clear cookies)
3. Make the same requests
4. Should return 401

### Test Multiple API Routes

Test all your protected routes:

- `/api/trips` (GET, POST)
- `/api/trips/[tripId]` (GET)
- `/api/trips/[tripId]/itinerary` (GET)
- `/api/trips/[tripId]/generate` (POST)
