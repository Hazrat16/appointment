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
import { useAuth } from "@/contexts/AuthContext";
import { authAPI, doctorsAPI } from "@/lib/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save, Stethoscope, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";

const personalSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
});

const professionalSchema = z.object({
  specialization: z.string().min(1, "Specialization is required"),
  bio: z.string().max(1000, "Bio cannot exceed 1000 characters").optional(),
  consultationFee: z.coerce.number().min(0, "Fee must be a non-negative number"),
  languages: z.string().optional(),
});

type PersonalFormData = z.infer<typeof personalSchema>;
type ProfessionalFormData = z.infer<typeof professionalSchema>;

export default function DoctorProfilePage() {
  const { user, updateUser } = useAuth();
  const router = useRouter();

  const {
    register: registerPersonal,
    handleSubmit: handlePersonalSubmit,
    formState: { errors: personalErrors, isSubmitting: savingPersonal },
    reset: resetPersonal,
  } = useForm<PersonalFormData>({ resolver: zodResolver(personalSchema) });

  const {
    register: registerProfessional,
    handleSubmit: handleProfessionalSubmit,
    formState: { errors: professionalErrors, isSubmitting: savingProfessional },
    reset: resetProfessional,
  } = useForm<ProfessionalFormData>({ resolver: zodResolver(professionalSchema) });

  useEffect(() => {
    if (!user) return;

    resetPersonal({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      phone: user.phone || "",
    });

    resetProfessional({
      specialization: user.doctorProfile?.specialization || "",
      bio: user.doctorProfile?.bio || "",
      consultationFee: user.doctorProfile?.consultationFee || 0,
      languages: user.doctorProfile?.languages?.join(", ") || "",
    });
  }, [user, resetPersonal, resetProfessional]);

  const onSubmitPersonal = async (data: PersonalFormData) => {
    try {
      const response = await authAPI.updateProfile(data);
      if (response.success && response.user) {
        updateUser({ ...user!, ...response.user });
        toast.success("Personal information updated");
      } else {
        throw new Error(response.message || "Failed to update profile");
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to update profile"
      );
    }
  };

  const onSubmitProfessional = async (data: ProfessionalFormData) => {
    try {
      const response = await doctorsAPI.updateDoctorProfile({
        specialization: data.specialization,
        bio: data.bio,
        consultationFee: data.consultationFee,
        languages: data.languages
          ? data.languages.split(",").map((l) => l.trim()).filter(Boolean)
          : [],
      });
      if (response.success && response.doctor) {
        updateUser({ ...user!, doctorProfile: response.doctor });
        toast.success("Professional information updated");
      } else {
        throw new Error(response.message || "Failed to update profile");
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to update profile"
      );
    }
  };

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
              <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="w-5 h-5 mr-2" />
              Personal Information
            </CardTitle>
            <CardDescription>Your name and contact details</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handlePersonalSubmit(onSubmitPersonal)}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <Input
                    {...registerPersonal("firstName")}
                    error={personalErrors.firstName?.message}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <Input
                    {...registerPersonal("lastName")}
                    error={personalErrors.lastName?.message}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <Input
                  {...registerPersonal("phone")}
                  type="tel"
                  error={personalErrors.phone?.message}
                />
              </div>
              <div className="flex justify-end">
                <Button
                  type="submit"
                  loading={savingPersonal}
                  disabled={savingPersonal}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Personal Info
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Stethoscope className="w-5 h-5 mr-2" />
              Professional Information
            </CardTitle>
            <CardDescription>
              Visible to patients browsing doctors. License, education and
              experience require admin re-verification, so they can&apos;t be
              edited here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleProfessionalSubmit(onSubmitProfessional)}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Specialization
                  </label>
                  <Input
                    {...registerProfessional("specialization")}
                    error={professionalErrors.specialization?.message}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Consultation Fee ($)
                  </label>
                  <Input
                    {...registerProfessional("consultationFee")}
                    type="number"
                    min="0"
                    step="0.01"
                    error={professionalErrors.consultationFee?.message}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio
                </label>
                <textarea
                  {...registerProfessional("bio")}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Tell patients about your background and approach..."
                />
                {professionalErrors.bio && (
                  <p className="text-sm text-red-600 mt-1">
                    {professionalErrors.bio.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Languages (comma-separated)
                </label>
                <Input
                  {...registerProfessional("languages")}
                  placeholder="English, Spanish"
                />
              </div>
              <div className="flex justify-end">
                <Button
                  type="submit"
                  loading={savingProfessional}
                  disabled={savingProfessional}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Professional Info
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
