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
  Clock,
  LogOut,
  User,
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

export default function DoctorAppointmentsPage() {
  const { logout } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");
  const [appointmentToCancel, setAppointmentToCancel] = useState<
    string | null
  >(null);
  const [appointmentToComplete, setAppointmentToComplete] =
    useState<Appointment | null>(null);
  const [diagnosis, setDiagnosis] = useState("");
  const [prescription, setPrescription] = useState("");

  const { data, isLoading: loading } = useQuery({
    queryKey: ["doctor-appointments", statusFilter],
    queryFn: () =>
      appointmentsAPI.getAppointments(
        statusFilter === "all" ? { limit: 100 } : { status: statusFilter, limit: 100 }
      ),
  });

  const appointments = data?.appointments ?? [];

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["doctor-appointments"] });

  const confirmMutation = useMutation({
    mutationFn: (id: string) =>
      appointmentsAPI.updateAppointment(id, { status: "confirmed" }),
    onSuccess: () => {
      toast.success("Appointment confirmed");
      invalidate();
    },
    onError: () => toast.error("Failed to confirm appointment"),
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

  const completeMutation = useMutation({
    mutationFn: (id: string) =>
      appointmentsAPI.updateAppointment(id, {
        status: "completed",
        diagnosis: diagnosis || undefined,
        prescription: prescription || undefined,
      }),
    onSuccess: () => {
      toast.success("Appointment marked as completed");
      invalidate();
      setAppointmentToComplete(null);
      setDiagnosis("");
      setPrescription("");
    },
    onError: () => toast.error("Failed to complete appointment"),
  });

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
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Button
                variant="ghost"
                onClick={() => router.push("/doctor/dashboard")}
                className="mr-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">
                My Appointments
              </h1>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-wrap gap-2 mb-6">
          {STATUS_TABS.map((tab) => (
            <Button
              key={tab.value}
              variant={statusFilter === tab.value ? "primary" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(tab.value)}
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {appointments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {appointments.map((appointment) => (
              <Card
                key={appointment.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
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
                  <CardDescription>{appointment.patient.email}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      {formatDate(appointment.appointmentDate, "MMM dd, yyyy")}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="w-4 h-4 mr-2" />
                      {formatTime(appointment.startTime)} -{" "}
                      {formatTime(appointment.endTime)}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <User className="w-4 h-4 mr-2" />
                      {formatCurrency(appointment.consultationFee)}
                    </div>
                    {appointment.symptoms && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-gray-700">
                          Symptoms:
                        </p>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {appointment.symptoms}
                        </p>
                      </div>
                    )}

                    {appointment.status === "scheduled" && (
                      <div className="flex gap-2 pt-2">
                        <Button
                          className="flex-1"
                          onClick={() => confirmMutation.mutate(appointment.id)}
                          loading={
                            confirmMutation.isPending &&
                            confirmMutation.variables === appointment.id
                          }
                          disabled={confirmMutation.isPending}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Confirm
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setAppointmentToCancel(appointment.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}

                    {appointment.status === "confirmed" && (
                      <div className="flex flex-col gap-2 pt-2">
                        <Button
                          className="w-full"
                          onClick={() => setAppointmentToComplete(appointment)}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Mark Completed
                        </Button>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => noShowMutation.mutate(appointment.id)}
                            loading={
                              noShowMutation.isPending &&
                              noShowMutation.variables === appointment.id
                            }
                            disabled={noShowMutation.isPending}
                          >
                            <UserX className="w-4 h-4 mr-2" />
                            No-show
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() =>
                              setAppointmentToCancel(appointment.id)
                            }
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {appointment.status === "completed" &&
                      appointment.diagnosis && (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-gray-700">
                            Diagnosis:
                          </p>
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {appointment.diagnosis}
                          </p>
                        </div>
                      )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No appointments found
              </h3>
              <p className="text-gray-600">
                {statusFilter === "all"
                  ? "You don't have any appointments yet."
                  : `You don't have any ${statusFilter} appointments.`}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

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

      {appointmentToComplete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setAppointmentToComplete(null)}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900">
              Complete appointment
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Add diagnosis and prescription notes (optional).
            </p>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Diagnosis
                </label>
                <textarea
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Diagnosis notes..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prescription
                </label>
                <textarea
                  value={prescription}
                  onChange={(e) => setPrescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Prescription details..."
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setAppointmentToComplete(null)}
                disabled={completeMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={() =>
                  appointmentToComplete &&
                  completeMutation.mutate(appointmentToComplete.id)
                }
                loading={completeMutation.isPending}
              >
                Mark Completed
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
