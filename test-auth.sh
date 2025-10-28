#!/bin/bash

# Authentication Testing Script
# Run this script to test if authentication wrapper is working

BASE_URL="http://localhost:3000"

echo "🔐 Testing Authentication Wrapper..."
echo "=================================="

# Test 1: Unauthenticated request (should return 401)
echo "Test 1: Unauthenticated API request"
echo "-----------------------------------"
response=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$BASE_URL/api/test-auth")
http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d: -f2)
body=$(echo "$response" | sed '/HTTP_CODE:/d')

if [ "$http_code" = "401" ]; then
    echo "✅ PASS: Unauthenticated request correctly returns 401"
else
    echo "❌ FAIL: Expected 401, got $http_code"
fi

echo "Response: $body"
echo ""

# Test 2: Test trips endpoint without auth
echo "Test 2: Unauthenticated trips request"
echo "-----------------------------------"
response=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$BASE_URL/api/trips")
http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d: -f2)
body=$(echo "$response" | sed '/HTTP_CODE:/d')

if [ "$http_code" = "401" ]; then
    echo "✅ PASS: Trips endpoint correctly requires authentication"
else
    echo "❌ FAIL: Expected 401, got $http_code"
fi

echo "Response: $body"
echo ""

echo "📝 Manual Testing Instructions:"
echo "==============================="
echo "1. Start your dev server: npm run dev"
echo "2. Open browser and go to: http://localhost:3000"
echo "3. Login to your account"
echo "4. Open Developer Tools (F12)"
echo "5. Go to Network tab"
echo "6. Refresh the page and look for API calls"
echo "7. Check that authenticated requests return data (200 status)"
echo "8. Test the auth test component by adding it to a page:"
echo "   import AuthTestComponent from '@/app/components/AuthTestComponent'"
echo "   <AuthTestComponent />"
echo ""
echo "9. Test the test API endpoint:"
echo "   curl http://localhost:3000/api/test-auth"
echo "   (Should return user data if authenticated)"
