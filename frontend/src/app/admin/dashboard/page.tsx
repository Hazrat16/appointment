"use client";

import Button from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useAuth } from "@/contexts/AuthContext";
import { doctorsAPI } from "@/lib/api";
import {
  CheckCircle,
  Clock,
  LogOut,
  Shield,
  UserCheck,
  Users,
  UserX,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface DoctorStats {
  total: number;
  verified: number;
  unverified: number;
  verificationRate: number;
}

interface UnverifiedDoctor {
  id: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  specialization: string;
  isVerified: boolean;
  createdAt: string;
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DoctorStats | null>(null);
  const [recentUnverified, setRecentUnverified] = useState<UnverifiedDoctor[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== "admin") {
      router.push("/auth/login");
      return;
    }

    fetchDashboardData();
  }, [user, router]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await doctorsAPI.getDoctorStats();

      if (response.success) {
        setStats(response.stats);
        setRecentUnverified(response.recentUnverified || []);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/auth/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">
                Admin Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {user?.firstName} {user?.lastName}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Doctors
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total || 0}</div>
              <p className="text-xs text-muted-foreground">
                All registered doctors
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Verified Doctors
              </CardTitle>
              <UserCheck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats?.verified || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Active and verified
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Verification
              </CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {stats?.unverified || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Awaiting verification
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Verification Rate
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats?.verificationRate || 0}%
              </div>
              <p className="text-xs text-muted-foreground">Success rate</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Manage doctors and system settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link href="/admin/doctors">
                <Button className="w-full justify-start" variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  Manage Doctors
                </Button>
              </Link>
              <Link href="/admin/doctors?filter=unverified">
                <Button className="w-full justify-start" variant="outline">
                  <UserX className="h-4 w-4 mr-2" />
                  Review Pending Verifications
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Unverified Doctors</CardTitle>
              <CardDescription>
                Latest doctors awaiting verification
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentUnverified.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No unverified doctors at the moment
                </p>
              ) : (
                <div className="space-y-3">
                  {recentUnverified.slice(0, 3).map((doctor) => (
                    <div
                      key={doctor.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-sm">
                          Dr. {doctor.user.firstName} {doctor.user.lastName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {doctor.specialization} • {doctor.user.email}
                        </p>
                      </div>
                      <Link href={`/admin/doctors?doctor=${doctor.id}`}>
                        <Button size="sm" variant="outline">
                          Review
                        </Button>
                      </Link>
                    </div>
                  ))}
                  {recentUnverified.length > 3 && (
                    <div className="text-center">
                      <Link href="/admin/doctors">
                        <Button variant="link" size="sm">
                          View All ({recentUnverified.length})
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>
              Current system health and statistics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {stats?.verified || 0}
                </div>
                <div className="text-sm text-gray-600">Active Doctors</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {stats?.verificationRate || 0}%
                </div>
                <div className="text-sm text-gray-600">Verification Rate</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-gray-600">
                  {stats?.total || 0}
                </div>
                <div className="text-sm text-gray-600">Total Doctors</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
