"use client";

import Button from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useAuth } from "@/contexts/AuthContext";
import { doctorsAPI } from "@/lib/api";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  LogOut,
  Search,
  Shield,
  UserCheck,
  UserX,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

interface Doctor {
  id: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  specialization: string;
  licenseNumber: string;
  experience: number;
  consultationFee: number;
  bio?: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminDoctorsPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const [filter, setFilter] = useState<string>("all");
  const [searchInput, setSearchInput] = useState<string>("");
  const [activeSearch, setActiveSearch] = useState<string>("");

  const doctorId = searchParams.get("doctor");

  // Normalizes the dashboard's `?filter=unverified` deep link onto the
  // "true"/"false" values the tabs below actually use.
  useEffect(() => {
    const filterParam = searchParams.get("filter");
    if (filterParam === "unverified") {
      setFilter("false");
    } else if (filterParam === "verified") {
      setFilter("true");
    } else if (filterParam) {
      setFilter(filterParam);
    }
  }, [searchParams]);

  const { data, isLoading: loading } = useQuery({
    queryKey: ["admin-doctors", filter, activeSearch],
    queryFn: () =>
      doctorsAPI.getAllDoctorsAdmin({
        ...(filter !== "all" ? { verificationStatus: filter === "true" } : {}),
        ...(activeSearch ? { search: activeSearch } : {}),
      }),
  });

  const doctors: Doctor[] = data?.doctors ?? [];
  const total = data?.total ?? 0;

  // Tab counts come from the stats endpoint, not the current (possibly
  // filtered) `doctors` list — otherwise "Verified"/"Pending" would show 0
  // whenever the opposite tab is active.
  const { data: statsData } = useQuery({
    queryKey: ["admin-doctor-stats"],
    queryFn: () => doctorsAPI.getDoctorStats(),
  });
  const stats = (statsData as any)?.stats as
    | { total: number; verified: number; unverified: number }
    | undefined;

  const verifyMutation = useMutation({
    mutationFn: ({ id, isVerified }: { id: string; isVerified: boolean }) =>
      doctorsAPI.verifyDoctor(id, isVerified),
    onSuccess: (response) => {
      toast.success(response.message ?? "Verification updated");
      queryClient.invalidateQueries({ queryKey: ["admin-doctors"] });
      queryClient.invalidateQueries({ queryKey: ["admin-doctor-stats"] });
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to update verification status"
      );
    },
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearch(searchInput);
  };

  const handleLogout = () => {
    logout();
    router.push("/auth/login");
  };

  const filteredDoctors = doctors.filter((doctor) => {
    if (doctorId && doctor.id !== doctorId) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/admin/dashboard">
                <Button variant="ghost" size="sm" className="mr-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <Shield className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">
                Doctor Management
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {user?.firstName} {user?.lastName}
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Filters and Search */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center justify-between">
            <div className="flex flex-wrap gap-3">
              <Button
                variant={filter === "all" ? "primary" : "outline"}
                size="sm"
                onClick={() => setFilter("all")}
              >
                All ({stats?.total ?? total})
              </Button>
              <Button
                variant={filter === "true" ? "primary" : "outline"}
                size="sm"
                onClick={() => setFilter("true")}
                className={filter === "true" ? "" : "text-green-600"}
              >
                <UserCheck className="h-4 w-4 mr-1" />
                Verified ({stats?.verified ?? 0})
              </Button>
              <Button
                variant={filter === "false" ? "primary" : "outline"}
                size="sm"
                onClick={() => setFilter("false")}
                className={filter === "false" ? "" : "text-yellow-600"}
              >
                <Clock className="h-4 w-4 mr-1" />
                Pending ({stats?.unverified ?? 0})
              </Button>
            </div>

            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search doctors..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <Button type="submit" size="sm">
                Search
              </Button>
            </form>
          </div>
        </div>

        {/* Doctors List */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
        <div className="space-y-6">
          {filteredDoctors.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <UserX className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No doctors found
                </h3>
                <p className="text-gray-500">
                  {activeSearch || filter !== "all"
                    ? "Try adjusting your search or filter criteria."
                    : "No doctors have been registered yet."}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredDoctors.map((doctor) => (
              <Card
                key={doctor.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardContent className="p-6 sm:p-8">
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Dr. {doctor.user.firstName} {doctor.user.lastName}
                        </h3>
                        {doctor.isVerified ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Email:</span>{" "}
                          {doctor.user.email}
                        </div>
                        <div>
                          <span className="font-medium">Phone:</span>{" "}
                          {doctor.user.phone}
                        </div>
                        <div>
                          <span className="font-medium">Specialization:</span>{" "}
                          {doctor.specialization}
                        </div>
                        <div>
                          <span className="font-medium">License:</span>{" "}
                          {doctor.licenseNumber}
                        </div>
                        <div>
                          <span className="font-medium">Experience:</span>{" "}
                          {doctor.experience} years
                        </div>
                        <div>
                          <span className="font-medium">Fee:</span> $
                          {doctor.consultationFee}
                        </div>
                      </div>

                      {doctor.bio && (
                        <div className="mt-5">
                          <span className="font-medium text-sm">Bio:</span>
                          <p className="text-sm text-gray-600 mt-1.5">
                            {doctor.bio}
                          </p>
                        </div>
                      )}

                      <div className="mt-5 text-xs text-gray-500">
                        Registered:{" "}
                        {new Date(doctor.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      {doctor.isVerified ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            verifyMutation.mutate({
                              id: doctor.id,
                              isVerified: false,
                            })
                          }
                          disabled={verifyMutation.isPending}
                          className="text-red-600 border-red-600 hover:bg-red-50"
                        >
                          {verifyMutation.isPending &&
                          verifyMutation.variables?.id === doctor.id ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            <>
                              <UserX className="h-4 w-4 mr-1" />
                              Unverify
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() =>
                            verifyMutation.mutate({
                              id: doctor.id,
                              isVerified: true,
                            })
                          }
                          disabled={verifyMutation.isPending}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {verifyMutation.isPending &&
                          verifyMutation.variables?.id === doctor.id ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Verify
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
        )}
      </main>
    </div>
  );
}
