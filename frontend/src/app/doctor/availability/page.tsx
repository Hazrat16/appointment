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
import { getDayName, getShortDayName } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Calendar, Clock, Plus, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";

const availabilitySchema = z.object({
  availability: z
    .array(
      z.object({
        dayOfWeek: z.number().min(0).max(6),
        startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
        endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
        slotDuration: z.number().min(15).max(120).default(30),
      })
    )
    .min(1, "At least one availability slot is required"),
});

type AvailabilityFormData = z.infer<typeof availabilitySchema>;

interface AvailabilitySlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDuration: number;
}

export default function AvailabilityPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AvailabilityFormData>({
    resolver: zodResolver(availabilitySchema),
    defaultValues: {
      availability: [
        {
          dayOfWeek: 1,
          startTime: "09:00",
          endTime: "17:00",
          slotDuration: 30,
        },
        {
          dayOfWeek: 2,
          startTime: "09:00",
          endTime: "17:00",
          slotDuration: 30,
        },
        {
          dayOfWeek: 3,
          startTime: "09:00",
          endTime: "17:00",
          slotDuration: 30,
        },
        {
          dayOfWeek: 4,
          startTime: "09:00",
          endTime: "17:00",
          slotDuration: 30,
        },
        {
          dayOfWeek: 5,
          startTime: "09:00",
          endTime: "17:00",
          slotDuration: 30,
        },
      ],
    },
  });

  const availability = watch("availability");

  useEffect(() => {
    if (user?.role !== "doctor") {
      router.push("/auth/login");
      return;
    }
  }, [user, router]);

  const addAvailabilitySlot = () => {
    const newSlot: AvailabilitySlot = {
      dayOfWeek: 1,
      startTime: "09:00",
      endTime: "17:00",
      slotDuration: 30,
    };
    setValue("availability", [...availability, newSlot]);
  };

  const removeAvailabilitySlot = (index: number) => {
    const newAvailability = availability.filter((_, i) => i !== index);
    setValue("availability", newAvailability);
  };

  const updateAvailabilitySlot = (
    index: number,
    field: keyof AvailabilitySlot,
    value: any
  ) => {
    const newAvailability = [...availability];
    newAvailability[index] = { ...newAvailability[index], [field]: value };
    setValue("availability", newAvailability);
  };

  const onSubmit = async (data: AvailabilityFormData) => {
    try {
      setSaving(true);
      const response = await doctorsAPI.updateAvailability(data);

      if (response.success) {
        toast.success("Availability updated successfully!");
      } else {
        throw new Error(response.message || "Failed to update availability");
      }
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to update availability";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const daysOfWeek = [
    { value: 0, label: "Sunday" },
    { value: 1, label: "Monday" },
    { value: 2, label: "Tuesday" },
    { value: 3, label: "Wednesday" },
    { value: 4, label: "Thursday" },
    { value: 5, label: "Friday" },
    { value: 6, label: "Saturday" },
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
                onClick={() => router.push("/doctor/dashboard")}
                className="mr-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">
                Manage Availability
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Weekly Availability Schedule
            </CardTitle>
            <CardDescription>
              Set your available hours for each day of the week. Patients will
              only be able to book appointments during these times.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                {availability.map((slot, index) => (
                  <div key={index} className="p-4 border rounded-lg bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium text-gray-900">
                        {getDayName(slot.dayOfWeek)}
                      </h3>
                      {availability.length > 1 && (
                        <Button
                          type="button"
                          variant="error"
                          size="sm"
                          onClick={() => removeAvailabilitySlot(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Day of Week
                        </label>
                        <select
                          value={slot.dayOfWeek}
                          onChange={(e) =>
                            updateAvailabilitySlot(
                              index,
                              "dayOfWeek",
                              parseInt(e.target.value)
                            )
                          }
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                          {daysOfWeek.map((day) => (
                            <option key={day.value} value={day.value}>
                              {day.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Start Time
                        </label>
                        <input
                          type="time"
                          value={slot.startTime}
                          onChange={(e) =>
                            updateAvailabilitySlot(
                              index,
                              "startTime",
                              e.target.value
                            )
                          }
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          End Time
                        </label>
                        <input
                          type="time"
                          value={slot.endTime}
                          onChange={(e) =>
                            updateAvailabilitySlot(
                              index,
                              "endTime",
                              e.target.value
                            )
                          }
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Slot Duration (min)
                        </label>
                        <select
                          value={slot.slotDuration}
                          onChange={(e) =>
                            updateAvailabilitySlot(
                              index,
                              "slotDuration",
                              parseInt(e.target.value)
                            )
                          }
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                          <option value={15}>15 minutes</option>
                          <option value={30}>30 minutes</option>
                          <option value={45}>45 minutes</option>
                          <option value={60}>60 minutes</option>
                          <option value={90}>90 minutes</option>
                          <option value={120}>120 minutes</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {errors.availability && (
                <p className="text-sm text-error-600">
                  {errors.availability.message}
                </p>
              )}

              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={addAvailabilitySlot}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Another Day
                </Button>

                <Button type="submit" loading={saving} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Availability
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Availability Preview
            </CardTitle>
            <CardDescription>
              This is how your availability will appear to patients
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {availability.map((slot, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-primary-600">
                        {getShortDayName(slot.dayOfWeek)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {getDayName(slot.dayOfWeek)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {slot.startTime} - {slot.endTime}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Slot Duration</p>
                    <p className="font-medium text-gray-900">
                      {slot.slotDuration} min
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
