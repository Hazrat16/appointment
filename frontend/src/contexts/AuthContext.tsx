"use client";

import { authAPI } from "@/lib/api";
import { AuthContextType, RegisterRequest, User } from "@/types";
import React, { createContext, useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing token and user on mount
    if (typeof window !== "undefined") {
      const storedToken = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));

        // Verify token is still valid
        authAPI
          .getMe()
          .then((response) => {
            if (response.success && response.user) {
              setUser(response.user);
              if (typeof window !== "undefined") {
                localStorage.setItem("user", JSON.stringify(response.user));
              }
            } else {
              // Token is invalid, clear storage
              if (typeof window !== "undefined") {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
              }
              setToken(null);
              setUser(null);
            }
          })
          .catch((error) => {
            console.log("Token verification failed:", error);
            // Token is invalid, clear storage
            if (typeof window !== "undefined") {
              localStorage.removeItem("token");
              localStorage.removeItem("user");
            }
            setToken(null);
            setUser(null);
          })
          .finally(() => {
            setLoading(false);
          });
      } else {
        // No stored token, set loading to false immediately
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      setLoading(true);
      const response = await authAPI.login({ email, password });

      if (response.success && response.token && response.user) {
        setToken(response.token);
        setUser(response.user);
        if (typeof window !== "undefined") {
          localStorage.setItem("token", response.token);
          localStorage.setItem("user", JSON.stringify(response.user));
        }
        toast.success("Login successful!");
      } else {
        throw new Error(response.message || "Login failed");
      }
    } catch (error: any) {
      const message =
        error.response?.data?.message || error.message || "Login failed";
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: RegisterRequest): Promise<void> => {
    try {
      setLoading(true);
      const response = await authAPI.register(userData);

      if (response.success && response.token && response.user) {
        setToken(response.token);
        setUser(response.user);
        if (typeof window !== "undefined") {
          localStorage.setItem("token", response.token);
          localStorage.setItem("user", JSON.stringify(response.user));
        }
        toast.success("Registration successful!");
      } else {
        throw new Error(response.message || "Registration failed");
      }
    } catch (error: any) {
      const message =
        error.response?.data?.message || error.message || "Registration failed";
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = (): void => {
    setUser(null);
    setToken(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
    toast.success("Logged out successfully");
  };

  const updateUser = (userData: User): void => {
    setUser(userData);
    if (typeof window !== "undefined") {
      localStorage.setItem("user", JSON.stringify(userData));
    }
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    register,
    logout,
    updateUser,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
