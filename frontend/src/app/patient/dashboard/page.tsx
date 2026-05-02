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
import { appointmentsAPI } from "@/lib/api";
import {
  formatCurrency,
  formatDate,
  formatTime,
  getStatusColor,
} from "@/lib/utils";
import { Appointment } from "@/types";
import {
  ArrowRight,
  Calendar,
  Clock,
  LogOut,
  Plus,
  Search,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function PatientDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== "patient") {
      router.push("/auth/login");
      return;
    }

    fetchAppointments();
  }, [user, router]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await appointmentsAPI.getAppointments({ limit: 10 });
      if (response.success) {
        setAppointments(response.appointments || []);
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/auth/login");
  };

  const upcomingAppointments = appointments.filter(
    (apt) =>
      new Date(apt.appointmentDate) >= new Date() &&
      apt.status !== "cancelled" &&
      apt.status !== "completed"
  );

  const pastAppointments = appointments.filter(
    (apt) =>
      new Date(apt.appointmentDate) < new Date() || apt.status === "completed"
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-white/60 bg-white/80 shadow-soft backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-sm font-bold text-white shadow-md shadow-primary-900/20">
              {user?.firstName?.charAt(0) ?? "P"}
            </span>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-primary-600">
                Patient
              </p>
              <h1 className="text-lg font-semibold tracking-tight text-foreground">
                Dashboard
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/patient/doctors")}
            >
              <Search className="h-4 w-4" />
              Find doctors
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              Log out
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-10 animate-in">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Welcome back, {user?.firstName}
          </h2>
          <p className="mt-2 max-w-2xl text-base text-muted-foreground">
            Manage visits, explore providers, and keep your care organized in one
            place.
          </p>
        </div>

        <div className="mb-10 grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
          <Card
            className="cursor-pointer border-primary-100/80 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-glow"
            onClick={() => router.push("/patient/doctors")}
          >
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="rounded-xl bg-primary-100/90 p-3 ring-1 ring-primary-200/50">
                  <Search className="h-6 w-6 text-primary-700" />
                </div>
                <div className="ml-4">
                  <h3 className="font-semibold text-foreground">Find doctors</h3>
                  <p className="text-sm text-muted-foreground">
                    Search and book appointments
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer border-emerald-100/80 transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-card"
            onClick={() => router.push("/patient/appointments")}
          >
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="rounded-xl bg-emerald-100/90 p-3 ring-1 ring-emerald-200/50">
                  <Calendar className="h-6 w-6 text-emerald-700" />
                </div>
                <div className="ml-4">
                  <h3 className="font-semibold text-foreground">My appointments</h3>
                  <p className="text-sm text-muted-foreground">View and manage visits</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer border-violet-100/80 transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-card"
            onClick={() => router.push("/patient/profile")}
          >
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="rounded-xl bg-violet-100/90 p-3 ring-1 ring-violet-200/50">
                  <User className="h-6 w-6 text-violet-700" />
                </div>
                <div className="ml-4">
                  <h3 className="font-semibold text-foreground">My profile</h3>
                  <p className="text-sm text-muted-foreground">
                    Update your information
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upcoming Appointments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Upcoming Appointments
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/patient/appointments")}
                >
                  View All
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </CardTitle>
              <CardDescription>Your scheduled appointments</CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingAppointments.length > 0 ? (
                <div className="space-y-4">
                  {upcomingAppointments.slice(0, 3).map((appointment) => (
                    <div
                      key={appointment.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            Dr. {appointment.doctor.user.lastName}
                          </p>
                          <p className="text-sm text-gray-500">
                            {appointment.doctor.specialization}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatDate(
                              appointment.appointmentDate,
                              "MMM dd, yyyy"
                            )}{" "}
                            at {formatTime(appointment.startTime)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {formatCurrency(appointment.consultationFee)}
                        </p>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            appointment.status
                          )}`}
                        >
                          {appointment.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No upcoming appointments</p>
                  <Button onClick={() => router.push("/patient/doctors")}>
                    <Plus className="w-4 h-4 mr-2" />
                    Book Appointment
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Appointments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Recent Appointments
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/patient/appointments")}
                >
                  View All
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </CardTitle>
              <CardDescription>Your appointment history</CardDescription>
            </CardHeader>
            <CardContent>
              {pastAppointments.length > 0 ? (
                <div className="space-y-4">
                  {pastAppointments.slice(0, 3).map((appointment) => (
                    <div
                      key={appointment.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            Dr. {appointment.doctor.user.lastName}
                          </p>
                          <p className="text-sm text-gray-500">
                            {appointment.doctor.specialization}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatDate(
                              appointment.appointmentDate,
                              "MMM dd, yyyy"
                            )}{" "}
                            at {formatTime(appointment.startTime)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {formatCurrency(appointment.consultationFee)}
                        </p>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            appointment.status
                          )}`}
                        >
                          {appointment.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No past appointments</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Appointment Summary</CardTitle>
              <CardDescription>
                Overview of your appointment activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {upcomingAppointments.length}
                  </div>
                  <div className="text-sm text-gray-600">Upcoming</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {
                      pastAppointments.filter(
                        (apt) => apt.status === "completed"
                      ).length
                    }
                  </div>
                  <div className="text-sm text-gray-600">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {
                      appointments.filter((apt) => apt.status === "scheduled")
                        .length
                    }
                  </div>
                  <div className="text-sm text-gray-600">Scheduled</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {
                      appointments.filter((apt) => apt.status === "cancelled")
                        .length
                    }
                  </div>
                  <div className="text-sm text-gray-600">Cancelled</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
