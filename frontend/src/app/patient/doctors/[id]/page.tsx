"use client";

import Button from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useAuth } from "@/contexts/AuthContext";
import { appointmentsAPI, doctorsAPI } from "@/lib/api";
import { formatCurrency, getInitials } from "@/lib/utils";
import { CreateAppointmentRequest, Doctor } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  Star,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";

const appointmentSchema = z.object({
  appointmentDate: z.string().min(1, "Please select a date"),
  startTime: z.string().min(1, "Please select a time slot"),
  symptoms: z
    .string()
    .min(10, "Please describe your symptoms (min 10 characters)"),
  notes: z.string().optional(),
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
}

export default function DoctorBookingPage({
  params,
}: {
  params: { id: string };
}) {
  const { user } = useAuth();
  const router = useRouter();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [availability, setAvailability] = useState<TimeSlot[]>([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [booking, setBooking] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
  });

  const watchedDate = watch("appointmentDate");

  useEffect(() => {
    if (user?.role !== "patient") {
      router.push("/auth/login");
      return;
    }

    fetchDoctor();
  }, [user, router, params.id]);

  useEffect(() => {
    if (watchedDate) {
      fetchAvailability(watchedDate);
    }
  }, [watchedDate, params.id]);

  const fetchDoctor = async () => {
    try {
      setLoading(true);
      const response = await doctorsAPI.getDoctor(params.id);
      if (response.success) {
        setDoctor(response.doctor);
      } else {
        toast.error("Doctor not found");
        router.push("/patient/doctors");
      }
    } catch (error) {
      console.error("Error fetching doctor:", error);
      toast.error("Failed to load doctor information");
      router.push("/patient/doctors");
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailability = async (date: string) => {
    try {
      setLoadingAvailability(true);
      const response = await doctorsAPI.getDoctorAvailability(params.id, date);
      if (response.success) {
        setAvailability(response.availability || []);
      }
    } catch (error) {
      console.error("Error fetching availability:", error);
      toast.error("Failed to load availability");
    } finally {
      setLoadingAvailability(false);
    }
  };

  const onSubmit = async (data: AppointmentFormData) => {
    if (!doctor) return;

    try {
      setBooking(true);
      const appointmentData: CreateAppointmentRequest = {
        doctorId: params.id,
        appointmentDate: data.appointmentDate,
        startTime: data.startTime,
        endTime: data.startTime, // Will be calculated by backend
        symptoms: data.symptoms,
        notes: data.notes || "",
      };

      const response = await appointmentsAPI.createAppointment(appointmentData);
      if (response.success) {
        toast.success("Appointment booked successfully!");
        router.push("/patient/dashboard");
      } else {
        throw new Error(response.message || "Failed to book appointment");
      }
    } catch (error: any) {
      console.error("Error booking appointment:", error);
      toast.error(error.message || "Failed to book appointment");
    } finally {
      setBooking(false);
    }
  };

  const handleTimeSlotSelect = (startTime: string, endTime: string) => {
    setValue("startTime", startTime);
    setValue("endTime", endTime);
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3); // 3 months from now
    return maxDate.toISOString().split("T")[0];
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Doctor Not Found
          </h2>
          <p className="text-gray-600 mb-4">
            The doctor you're looking for doesn't exist.
          </p>
          <Button onClick={() => router.push("/patient/doctors")}>
            Back to Doctors
          </Button>
        </div>
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
                onClick={() => router.push("/patient/doctors")}
                className="mr-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Doctors
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">
                Book Appointment
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Doctor Info */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Doctor Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xl font-semibold text-primary-600">
                      {getInitials(doctor.user.firstName, doctor.user.lastName)}
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
                      <p className="text-sm text-gray-500">Consultation fee</p>
                    </div>

                    {doctor.bio && (
                      <p className="mt-3 text-sm text-gray-600">{doctor.bio}</p>
                    )}

                    {doctor.languages && doctor.languages.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-gray-700">
                          Languages:
                        </p>
                        <p className="text-sm text-gray-600">
                          {doctor.languages.join(", ")}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Booking Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Book Your Appointment</CardTitle>
                <CardDescription>
                  Select a date and time for your appointment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Date Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Date
                    </label>
                    <Input
                      {...register("appointmentDate")}
                      type="date"
                      min={getMinDate()}
                      max={getMaxDate()}
                      error={errors.appointmentDate?.message}
                    />
                  </div>

                  {/* Time Slots */}
                  {watchedDate && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Available Time Slots
                      </label>
                      {loadingAvailability ? (
                        <div className="flex items-center justify-center py-8">
                          <LoadingSpinner size="sm" />
                          <span className="ml-2 text-gray-600">
                            Loading availability...
                          </span>
                        </div>
                      ) : availability.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {availability.map((slot, index) => (
                            <button
                              key={index}
                              type="button"
                              disabled={!slot.available}
                              onClick={() =>
                                handleTimeSlotSelect(
                                  slot.startTime,
                                  slot.endTime
                                )
                              }
                              className={`p-3 text-sm border rounded-lg transition-colors ${
                                slot.available
                                  ? "border-gray-300 hover:border-primary-500 hover:bg-primary-50"
                                  : "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                              } ${
                                watch("startTime") === slot.startTime
                                  ? "border-primary-500 bg-primary-50 text-primary-700"
                                  : ""
                              }`}
                            >
                              <div className="flex items-center justify-center">
                                <Clock className="w-4 h-4 mr-1" />
                                {slot.startTime} - {slot.endTime}
                              </div>
                              {!slot.available && (
                                <div className="text-xs mt-1 text-center">
                                  Unavailable
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                          <p>No available slots for this date</p>
                          <p className="text-sm">Please select another date</p>
                        </div>
                      )}
                      {errors.startTime && (
                        <p className="text-sm text-red-600 mt-1">
                          {errors.startTime.message}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Symptoms */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Symptoms <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      {...register("symptoms")}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Please describe your symptoms or reason for the appointment..."
                    />
                    {errors.symptoms && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors.symptoms.message}
                      </p>
                    )}
                  </div>

                  {/* Additional Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Additional Notes (Optional)
                    </label>
                    <textarea
                      {...register("notes")}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Any additional information you'd like to share..."
                    />
                    {errors.notes && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors.notes.message}
                      </p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end space-x-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push("/patient/doctors")}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      loading={booking}
                      disabled={booking || !watchedDate || !watch("startTime")}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Book Appointment
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
