"use client";

import { authAPI } from "@/lib/api";
import { AuthContextType, RegisterRequest, User } from "@/types";
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
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

/** Only safe when this module runs on the client (see dynamic ssr:false shell). */
function readPersistedAuth(): { user: User | null; token: string | null } {
  try {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (!storedToken || !storedUser) return { user: null, token: null };
    return { token: storedToken, user: JSON.parse(storedUser) as User };
  } catch {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return { user: null, token: null };
  }
}

function shouldInvalidateSession(status: number | undefined): boolean {
  return status === 401 || status === 403 || status === 404;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => readPersistedAuth().user);
  const [token, setToken] = useState<string | null>(
    () => readPersistedAuth().token
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    let cancelled = false;
    authAPI
      .getMe()
      .then((response) => {
        if (cancelled) return;
        if (response.success && response.user) {
          setUser(response.user);
          localStorage.setItem("user", JSON.stringify(response.user));
        } else {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setToken(null);
          setUser(null);
        }
      })
      .catch((error: { response?: { status?: number } }) => {
        if (cancelled) return;
        const status = error.response?.status;
        if (shouldInvalidateSession(status)) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setToken(null);
          setUser(null);
        }
        // Network / 5xx / CORS: keep cached session so refresh doesn’t log users out offline.
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      setLoading(true);
      const response = await authAPI.login({ email, password });

      if (response.success && response.token && response.user) {
        setToken(response.token);
        setUser(response.user);
        localStorage.setItem("token", response.token);
        localStorage.setItem("user", JSON.stringify(response.user));
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
        localStorage.setItem("token", response.token);
        localStorage.setItem("user", JSON.stringify(response.user));
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
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Logged out successfully");
  };

  const updateUser = (userData: User): void => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
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
