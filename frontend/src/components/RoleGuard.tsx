"use client";

import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useAuth } from "@/contexts/AuthContext";
import { User } from "@/types";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface RoleGuardProps {
  role: User["role"];
  children: React.ReactNode;
}

/**
 * Centralizes the per-role route guard that used to be copy-pasted into every
 * page under app/patient, app/doctor and app/admin. Unauthenticated users are
 * sent to login; a logged-in user of the WRONG role is sent to their own
 * dashboard instead of login, since login isn't the fix for them.
 */
export default function RoleGuard({ role, children }: RoleGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push("/auth/login");
      return;
    }

    if (user.role !== role) {
      router.push(`/${user.role}/dashboard`);
    }
  }, [user, loading, role, router]);

  if (loading || !user || user.role !== role) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return <>{children}</>;
}
