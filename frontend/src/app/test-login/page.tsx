"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

export default function TestLoginPage() {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState("hazrat@yopmail.com");
  const [password, setPassword] = useState("password123");
  const [result, setResult] = useState("");

  const handleTestLogin = async () => {
    try {
      setResult("Attempting login...");
      await login(email, password);
      setResult("Login successful!");
    } catch (error: any) {
      setResult(`Login failed: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
      <div className="max-w-md w-full space-y-6">
        <h1 className="text-2xl font-bold text-center">Test Login</h1>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={handleTestLogin}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Test Login"}
          </button>

          {result && (
            <div className="p-3 bg-gray-100 rounded-md">
              <p className="text-sm">{result}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
