"use client";

import Button from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Input from "@/components/ui/Input";
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  LogOut,
  Search,
  Shield,
  UserX,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

const STATUS_TABS: { value: string; label: string }[] = [
  { value: "all", label: "All" },
  { value: "scheduled", label: "Scheduled" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "no-show", label: "No-show" },
];

const PAGE_SIZE = 12;

export default function AdminAppointmentsPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [appointmentToCancel, setAppointmentToCancel] = useState<
    string | null
  >(null);

  const { data, isLoading: loading } = useQuery({
    queryKey: ["admin-appointments", statusFilter, page],
    queryFn: () =>
      appointmentsAPI.getAppointments({
        ...(statusFilter !== "all" ? { status: statusFilter } : {}),
        page,
        limit: PAGE_SIZE,
      }),
  });

  const appointments = data?.appointments ?? [];
  const pagination = data?.pagination;

  const filteredAppointments = search
    ? appointments.filter((apt) => {
        const term = search.toLowerCase();
        return (
          `${apt.patient.firstName} ${apt.patient.lastName}`
            .toLowerCase()
            .includes(term) ||
          `${apt.doctor.user.firstName} ${apt.doctor.user.lastName}`
            .toLowerCase()
            .includes(term) ||
          apt.doctor.specialization.toLowerCase().includes(term)
        );
      })
    : appointments;

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["admin-appointments"] });

  const confirmMutation = useMutation({
    mutationFn: (id: string) =>
      appointmentsAPI.updateAppointment(id, { status: "confirmed" }),
    onSuccess: () => {
      toast.success("Appointment confirmed");
      invalidate();
    },
    onError: () => toast.error("Failed to confirm appointment"),
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) =>
      appointmentsAPI.updateAppointment(id, { status: "completed" }),
    onSuccess: () => {
      toast.success("Appointment marked as completed");
      invalidate();
    },
    onError: () => toast.error("Failed to complete appointment"),
  });

  const noShowMutation = useMutation({
    mutationFn: (id: string) =>
      appointmentsAPI.updateAppointment(id, { status: "no-show" }),
    onSuccess: () => {
      toast.success("Marked as no-show");
      invalidate();
    },
    onError: () => toast.error("Failed to update appointment"),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => appointmentsAPI.cancelAppointment(id),
    onSuccess: () => {
      toast.success("Appointment cancelled");
      invalidate();
      setAppointmentToCancel(null);
    },
    onError: () => {
      toast.error("Failed to cancel appointment");
      setAppointmentToCancel(null);
    },
  });

  const handleLogout = () => {
    logout();
    router.push("/auth/login");
  };

  const renderActions = (appointment: Appointment) => {
    if (appointment.status === "scheduled") {
      return (
        <div className="flex gap-2 pt-2">
          <Button
            className="flex-1"
            size="sm"
            onClick={() => confirmMutation.mutate(appointment.id)}
            loading={
              confirmMutation.isPending &&
              confirmMutation.variables === appointment.id
            }
            disabled={confirmMutation.isPending}
          >
            <CheckCircle className="w-4 h-4 mr-1" />
            Confirm
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAppointmentToCancel(appointment.id)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      );
    }

    if (appointment.status === "confirmed") {
      return (
        <div className="flex gap-2 pt-2">
          <Button
            className="flex-1"
            size="sm"
            onClick={() => completeMutation.mutate(appointment.id)}
            loading={
              completeMutation.isPending &&
              completeMutation.variables === appointment.id
            }
            disabled={completeMutation.isPending}
          >
            <CheckCircle className="w-4 h-4 mr-1" />
            Complete
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => noShowMutation.mutate(appointment.id)}
            loading={
              noShowMutation.isPending &&
              noShowMutation.variables === appointment.id
            }
            disabled={noShowMutation.isPending}
          >
            <UserX className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAppointmentToCancel(appointment.id)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/admin/dashboard")}
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <Shield className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">
                Appointment Management
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {user?.firstName} {user?.lastName}
              </span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
          <div className="flex flex-wrap gap-2">
            {STATUS_TABS.map((tab) => (
              <Button
                key={tab.value}
                variant={statusFilter === tab.value ? "primary" : "outline"}
                size="sm"
                onClick={() => {
                  setStatusFilter(tab.value);
                  setPage(1);
                }}
              >
                {tab.label}
              </Button>
            ))}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search patient or doctor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredAppointments.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {filteredAppointments.map((appointment) => (
                <Card
                  key={appointment.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        {appointment.patient.firstName}{" "}
                        {appointment.patient.lastName}
                      </CardTitle>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          appointment.status
                        )}`}
                      >
                        {appointment.status}
                      </span>
                    </div>
                    <CardDescription>
                      Dr. {appointment.doctor.user.firstName}{" "}
                      {appointment.doctor.user.lastName} &middot;{" "}
                      {appointment.doctor.specialization}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        {formatDate(
                          appointment.appointmentDate,
                          "MMM dd, yyyy"
                        )}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="w-4 h-4 mr-2" />
                        {formatTime(appointment.startTime)} -{" "}
                        {formatTime(appointment.endTime)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {formatCurrency(appointment.consultationFee)}
                      </div>
                      {renderActions(appointment)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {pagination && pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                <span className="text-sm text-gray-600">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPage((p) => Math.min(pagination.pages, p + 1))
                  }
                  disabled={page >= pagination.pages}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No appointments found
              </h3>
              <p className="text-gray-600">
                Try adjusting your search or status filter.
              </p>
            </CardContent>
          </Card>
        )}
      </main>

      <ConfirmDialog
        open={appointmentToCancel !== null}
        title="Cancel this appointment?"
        description="This action cannot be undone."
        confirmLabel="Cancel Appointment"
        cancelLabel="Keep Appointment"
        variant="error"
        loading={cancelMutation.isPending}
        onConfirm={() =>
          appointmentToCancel && cancelMutation.mutate(appointmentToCancel)
        }
        onCancel={() => setAppointmentToCancel(null)}
      />
    </div>
  );
}
