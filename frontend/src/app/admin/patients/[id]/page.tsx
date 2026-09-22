"use client";

import Button from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { appointmentsAPI, patientsAPI } from "@/lib/api";
import {
  formatCurrency,
  formatDate,
  formatTime,
  getStatusColor,
} from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Clock,
  Mail,
  MapPin,
  Phone,
  Stethoscope,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function AdminPatientDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();

  const { data: patientData, isLoading: loadingPatient } = useQuery({
    queryKey: ["admin-patient", params.id],
    queryFn: () => patientsAPI.getPatientAdmin(params.id),
  });

  const { data: appointmentsData, isLoading: loadingAppointments } = useQuery(
    {
      queryKey: ["admin-patient-appointments", params.id],
      queryFn: () =>
        appointmentsAPI.getAppointments({ patientId: params.id, limit: 50 }),
      enabled: !!patientData?.patient,
    }
  );

  const patient = patientData?.patient;
  const appointments = appointmentsData?.appointments ?? [];

  if (loadingPatient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Patient not found
          </h2>
          <Button onClick={() => router.push("/admin/patients")}>
            Back to Patients
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/admin/patients")}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Patients
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">
              {patient.firstName} {patient.lastName}
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-100">
                    <User className="h-7 w-7 text-primary-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">
                      {patient.firstName} {patient.lastName}
                    </CardTitle>
                    {!patient.isActive && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 mt-1">
                        Deactivated
                      </span>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-4 h-4" />
                  {patient.email}
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-4 h-4" />
                  {patient.phone}
                </div>
                {(patient.address?.city || patient.city) && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4" />
                    {patient.address?.city || patient.city},{" "}
                    {patient.address?.state || patient.state}
                  </div>
                )}
                <div className="pt-3 border-t space-y-2">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Medical info
                  </p>
                  <p>
                    <span className="font-medium">Allergies:</span>{" "}
                    {patient.allergies || "None recorded"}
                  </p>
                  <p>
                    <span className="font-medium">Current medications:</span>{" "}
                    {patient.currentMedications || "None recorded"}
                  </p>
                  <p>
                    <span className="font-medium">Medical history:</span>{" "}
                    {patient.medicalHistory || "None recorded"}
                  </p>
                </div>
                <div className="pt-3 border-t space-y-1 text-xs text-gray-500">
                  <p>
                    Registered:{" "}
                    {formatDate(patient.createdAt, "MMM dd, yyyy")}
                  </p>
                  {patient.lastLogin && (
                    <p>
                      Last login:{" "}
                      {formatDate(patient.lastLogin, "MMM dd, yyyy")}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Appointment history */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Appointment History
            </h2>

            {loadingAppointments ? (
              <div className="flex items-center justify-center py-16">
                <LoadingSpinner size="lg" />
              </div>
            ) : appointments.length > 0 ? (
              <div className="space-y-4">
                {appointments.map((appointment) => (
                  <Card key={appointment.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Stethoscope className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-900">
                            Dr. {appointment.doctor.user.firstName}{" "}
                            {appointment.doctor.user.lastName}
                          </span>
                          <span className="text-sm text-gray-500">
                            &middot; {appointment.doctor.specialization}
                          </span>
                        </div>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            appointment.status
                          )}`}
                        >
                          {appointment.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4" />
                          {formatDate(
                            appointment.appointmentDate,
                            "MMM dd, yyyy"
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          {formatTime(appointment.startTime)} -{" "}
                          {formatTime(appointment.endTime)}
                        </div>
                        <div>{formatCurrency(appointment.consultationFee)}</div>
                      </div>
                      {appointment.symptoms && (
                        <p className="mt-2 text-sm text-gray-600">
                          <span className="font-medium">Symptoms:</span>{" "}
                          {appointment.symptoms}
                        </p>
                      )}
                      {appointment.diagnosis && (
                        <p className="mt-1 text-sm text-gray-600">
                          <span className="font-medium">Diagnosis:</span>{" "}
                          {appointment.diagnosis}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    This patient has no appointments yet.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
