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
import { appointmentsAPI, doctorsAPI } from "@/lib/api";
import { formatCurrency, formatDate, formatTime, getInitials } from "@/lib/utils";
import { CreateAppointmentRequest, Doctor } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  Languages as LanguagesIcon,
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
  endTime: z.string().optional(),
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
  const watchedStartTime = watch("startTime");
  const watchedEndTime = watch("endTime");

  useEffect(() => {
    if (params.id) {
      fetchDoctor();
    }
  }, [params.id]);

  useEffect(() => {
    if (watchedDate) {
      fetchAvailability(watchedDate);
    }
  }, [watchedDate, params.id]);

  const fetchDoctor = async () => {
    if (!params.id) {
      toast.error("Invalid doctor ID");
      router.push("/patient/doctors");
      return;
    }

    try {
      setLoading(true);
      const response = await doctorsAPI.getDoctor(params.id);

      if (response.success && response.doctor) {
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
    if (!params.id) {
      return;
    }

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
        endTime: data.endTime || data.startTime, // Use actual end time or fallback to start time
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
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-error-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Doctor not found
          </h2>
          <p className="text-muted-foreground mb-6">
            The doctor you&apos;re looking for doesn&apos;t exist.
          </p>
          <Button onClick={() => router.push("/patient/doctors")}>
            Back to doctors
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/60 bg-white/80 shadow-soft backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center px-4 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/patient/doctors")}
            className="mr-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Doctors
          </Button>
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            Book Appointment
          </h1>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Doctor Info */}
          <div className="lg:col-span-2">
            <Card className="sticky top-24 animate-in">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-md shadow-primary-900/15">
                    <span className="text-xl font-bold text-white">
                      {getInitials(doctor.user.firstName, doctor.user.lastName)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-foreground">
                      Dr. {doctor.user.firstName} {doctor.user.lastName}
                    </h3>
                    <span className="badge badge-default mt-1.5 inline-flex">
                      {doctor.specialization}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-amber-400 fill-current" />
                    <span className="font-medium text-foreground">
                      {doctor.rating.average.toFixed(1)}
                    </span>
                    <span>({doctor.rating.count} reviews)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    {doctor.experience} yrs experience
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-primary-100 bg-primary-50/70 p-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-white shadow-soft">
                    <DollarSign className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-lg font-bold leading-none text-foreground">
                      {formatCurrency(doctor.consultationFee)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Consultation fee
                    </p>
                  </div>
                </div>

                {doctor.bio && (
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1.5">
                      About
                    </p>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {doctor.bio}
                    </p>
                  </div>
                )}

                {doctor.languages && doctor.languages.length > 0 && (
                  <div>
                    <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-foreground">
                      <LanguagesIcon className="w-4 h-4" />
                      Languages
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {doctor.languages.map((lang) => (
                        <span key={lang} className="badge badge-secondary">
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Booking Form */}
          <div className="lg:col-span-3">
            <Card className="animate-in">
              <CardHeader>
                <CardTitle>Book Your Appointment</CardTitle>
                <CardDescription>
                  Select a date and time for your appointment. Bookings must
                  be at least 2 hours before the slot. If you need to cancel,
                  do so more than 24 hours before the visit (policy is
                  enforced on the server).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Date Selection */}
                  <Input
                    label="Select date"
                    {...register("appointmentDate")}
                    type="date"
                    min={getMinDate()}
                    max={getMaxDate()}
                    error={errors.appointmentDate?.message}
                  />

                  {/* Hidden endTime field */}
                  <input {...register("endTime")} type="hidden" />

                  {/* Time Slots */}
                  {watchedDate && (
                    <div>
                      <label className="label mb-2 block">
                        Available time slots
                      </label>
                      {loadingAvailability ? (
                        <div className="flex items-center justify-center rounded-xl border border-dashed border-input py-8">
                          <LoadingSpinner size="sm" />
                          <span className="ml-2 text-sm text-muted-foreground">
                            Loading availability...
                          </span>
                        </div>
                      ) : availability.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                          {availability.map((slot, index) => {
                            const selected =
                              watchedStartTime === slot.startTime;
                            return (
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
                                className={`rounded-xl border p-3 text-sm font-medium transition-all duration-150 ${
                                  !slot.available
                                    ? "cursor-not-allowed border-input/60 bg-muted/60 text-muted-foreground/70"
                                    : selected
                                    ? "border-primary-400 bg-gradient-to-b from-primary-500 to-primary-700 text-white shadow-md shadow-primary-900/15"
                                    : "border-input bg-white/90 text-foreground shadow-soft hover:-translate-y-0.5 hover:border-primary-300 hover:bg-primary-50"
                                }`}
                              >
                                <div className="flex items-center justify-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5" />
                                  {slot.startTime} - {slot.endTime}
                                </div>
                                {!slot.available && (
                                  <div className="mt-1 text-center text-xs">
                                    Unavailable
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="rounded-xl border border-dashed border-input py-8 text-center text-muted-foreground">
                          <Calendar className="w-10 h-10 mx-auto mb-2 opacity-60" />
                          <p className="text-sm font-medium">
                            No available slots for this date
                          </p>
                          <p className="text-xs">Please select another date</p>
                        </div>
                      )}
                      {errors.startTime && (
                        <p className="form-error">{errors.startTime.message}</p>
                      )}
                    </div>
                  )}

                  {/* Symptoms */}
                  <div>
                    <label className="label mb-2 block">
                      Symptoms <span className="text-error-500">*</span>
                    </label>
                    <textarea
                      {...register("symptoms")}
                      rows={4}
                      className="input h-auto resize-none py-2.5"
                      placeholder="Please describe your symptoms or reason for the appointment..."
                    />
                    {errors.symptoms && (
                      <p className="form-error">{errors.symptoms.message}</p>
                    )}
                  </div>

                  {/* Additional Notes */}
                  <div>
                    <label className="label mb-2 block">
                      Additional notes (optional)
                    </label>
                    <textarea
                      {...register("notes")}
                      rows={3}
                      className="input h-auto resize-none py-2.5"
                      placeholder="Any additional information you'd like to share..."
                    />
                    {errors.notes && (
                      <p className="form-error">{errors.notes.message}</p>
                    )}
                  </div>

                  {/* Summary */}
                  {watchedDate && watchedStartTime && (
                    <div className="rounded-xl border border-primary-100 bg-primary-50/70 p-4 text-sm">
                      <p className="font-medium text-foreground">
                        You&apos;re booking with Dr. {doctor.user.lastName}
                      </p>
                      <p className="mt-1 text-muted-foreground">
                        {formatDate(watchedDate, "EEEE, MMM d, yyyy")} &middot;{" "}
                        {formatTime(watchedStartTime)}
                        {watchedEndTime ? ` - ${formatTime(watchedEndTime)}` : ""}{" "}
                        &middot; {formatCurrency(doctor.consultationFee)}
                      </p>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="flex justify-end gap-3 pt-2">
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
                      disabled={booking || !watchedDate || !watchedStartTime}
                    >
                      <CheckCircle className="w-4 h-4" />
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
