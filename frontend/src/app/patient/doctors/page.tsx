"use client";

import Button from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useAuth } from "@/contexts/AuthContext";
import { doctorsAPI } from "@/lib/api";
import { debounce, formatCurrency, getInitials } from "@/lib/utils";
import { ArrowLeft, Calendar, Clock, Filter, Search, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";

export default function DoctorsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [specialization, setSpecialization] = useState("");

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ["doctors", { search: searchTerm, specialization }],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      doctorsAPI.getDoctors({
        search: searchTerm,
        specialization: specialization || undefined,
        page: pageParam,
        limit: 12,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.pagination && lastPage.pagination.page < lastPage.pagination.pages
        ? lastPage.pagination.page + 1
        : undefined,
    enabled: user?.role === "patient",
  });

  const doctors = data?.pages.flatMap((page) => page.doctors || []) ?? [];
  const loading = isLoading;
  const hasMore = Boolean(hasNextPage);

  const debouncedSearch = debounce((term: string) => {
    setSearchTerm(term);
  }, 500);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value);
  };

  const handleSpecializationChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setSpecialization(e.target.value);
  };

  const loadMore = () => {
    fetchNextPage();
  };

  const specializations = [
    "Cardiology",
    "Dermatology",
    "Endocrinology",
    "Gastroenterology",
    "Hematology",
    "Neurology",
    "Oncology",
    "Orthopedics",
    "Pediatrics",
    "Psychiatry",
    "Radiology",
    "Urology",
  ];

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
              <Button
                variant="ghost"
                onClick={() => router.push("/patient/dashboard")}
                className="mr-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">Find Doctors</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search Doctors
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by name or specialization..."
                    onChange={handleSearchChange}
                    className="pl-10"
                  />
                </div>
              </div>

              <Select
                label="Specialization"
                value={specialization}
                onChange={handleSpecializationChange}
              >
                <option value="">All specializations</option>
                {specializations.map((spec) => (
                  <option key={spec} value={spec}>
                    {spec}
                  </option>
                ))}
              </Select>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setSpecialization("");
                  }}
                  className="w-full"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Doctors Grid */}
        {doctors.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {doctors.map((doctor) => (
                <Card
                  key={doctor.id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-xl font-semibold text-primary-600">
                          {getInitials(
                            doctor.user.firstName,
                            doctor.user.lastName
                          )}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Dr. {doctor.user.firstName} {doctor.user.lastName}
                        </h3>
                        <p className="text-sm text-primary-600 font-medium">
                          {doctor.specialization}
                        </p>

                        <div className="flex items-center mt-2">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="ml-1 text-sm text-gray-600">
                            {doctor.rating.average.toFixed(1)} (
                            {doctor.rating.count} reviews)
                          </span>
                        </div>

                        <div className="flex items-center mt-1">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="ml-1 text-sm text-gray-600">
                            {doctor.experience} years experience
                          </span>
                        </div>

                        <div className="mt-3">
                          <p className="text-lg font-bold text-gray-900">
                            {formatCurrency(doctor.consultationFee)}
                          </p>
                          <p className="text-sm text-gray-500">
                            Consultation fee
                          </p>
                        </div>

                        {doctor.bio && (
                          <p className="mt-3 text-sm text-gray-600 line-clamp-2">
                            {doctor.bio}
                          </p>
                        )}

                        <div className="mt-4">
                          <Button
                            className="w-full"
                            onClick={() => router.push(`/patient/doctors/${doctor.id}`)}
                          >
                            <Calendar className="w-4 h-4 mr-2" />
                            Book Appointment
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="text-center">
                <Button
                  variant="outline"
                  onClick={loadMore}
                  loading={isFetchingNextPage}
                  disabled={isFetchingNextPage}
                >
                  Load More Doctors
                </Button>
              </div>
            )}
          </>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No doctors found
              </h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your search criteria or filters
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setSpecialization("");
                }}
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
