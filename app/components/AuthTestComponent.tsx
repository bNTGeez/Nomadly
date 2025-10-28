"use client";

import { useAuth, useRequireAuth } from "@/lib/auth-context";
import { useState } from "react";

/**
 * Test component to verify authentication context is working
 * Add this to any page temporarily to test authentication state
 */
export default function AuthTestComponent() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [testResult, setTestResult] = useState<string>("");

  const testRequireAuth = () => {
    try {
      const { user } = useRequireAuth();
      setTestResult(`✅ useRequireAuth works! User: ${user.name}`);
    } catch (error) {
      setTestResult(`❌ useRequireAuth failed: ${error}`);
    }
  };

  return (
    <div className="p-6 border rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold mb-4">🔐 Authentication Test</h3>

      <div className="space-y-2">
        <p>
          <strong>Loading:</strong> {isLoading ? "Yes" : "No"}
        </p>
        <p>
          <strong>Authenticated:</strong> {isAuthenticated ? "Yes" : "No"}
        </p>

        {user ? (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
            <h4 className="font-medium text-green-800">
              ✅ User Data Available:
            </h4>
            <ul className="mt-2 text-sm text-green-700">
              <li>
                <strong>ID:</strong> {user.id}
              </li>
              <li>
                <strong>Email:</strong> {user.email}
              </li>
              <li>
                <strong>Name:</strong> {user.name}
              </li>
              <li>
                <strong>Username:</strong> {user.username}
              </li>
            </ul>
          </div>
        ) : (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
            <p className="text-red-700">❌ No user data available</p>
          </div>
        )}

        <button
          onClick={testRequireAuth}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Test useRequireAuth Hook
        </button>

        {testResult && (
          <div className="mt-2 p-2 bg-gray-100 rounded text-sm">
            {testResult}
          </div>
        )}
      </div>
    </div>
  );
}
