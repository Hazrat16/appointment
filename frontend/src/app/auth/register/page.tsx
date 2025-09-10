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
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, User, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const registerSchema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Please confirm your password"),
    phone: z.string().min(1, "Phone number is required"),
    dateOfBirth: z.string().min(1, "Date of birth is required"),
    gender: z.enum(["male", "female", "other"], {
      required_error: "Please select a gender",
    }),
    role: z.enum(["patient", "doctor"], {
      required_error: "Please select a role",
    }),
    // Doctor specific fields
    specialization: z.string().optional(),
    licenseNumber: z.string().optional(),
    experience: z.number().optional(),
    consultationFee: z.number().optional(),
    bio: z.string().optional(),
    languages: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })
  .refine(
    (data) => {
      if (data.role === "doctor") {
        return (
          data.specialization &&
          data.licenseNumber &&
          data.experience !== undefined &&
          data.consultationFee !== undefined
        );
      }
      return true;
    },
    {
      message: "Doctor-specific fields are required when role is doctor",
      path: ["specialization"],
    }
  );

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register: registerUser, loading } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: "onSubmit",
    defaultValues: {
      role: "patient",
    },
  });

  const selectedRole = watch("role");

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const { confirmPassword, ...registerData } = data;

      // Process languages if provided
      if (
        registerData.languages &&
        typeof registerData.languages === "string"
      ) {
        registerData.languages = registerData.languages
          .split(",")
          .map((lang) => lang.trim());
      }

      await registerUser(registerData);
    } catch (error) {
      // Error is handled by the AuthContext
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Create Account</h1>
          <p className="mt-2 text-sm text-gray-600">
            Join our platform to book appointments or manage your practice
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">Sign Up</CardTitle>
            <CardDescription className="text-center">
              Fill in your information to create your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  I am a:
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <label className="relative">
                    <input
                      {...register("role")}
                      type="radio"
                      value="patient"
                      className="sr-only"
                    />
                    <div
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                        selectedRole === "patient"
                          ? "border-primary-500 bg-primary-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <User className="w-6 h-6 mx-auto mb-2 text-primary-600" />
                      <div className="text-center">
                        <div className="font-medium">Patient</div>
                        <div className="text-sm text-gray-500">
                          Book appointments
                        </div>
                      </div>
                    </div>
                  </label>
                  <label className="relative">
                    <input
                      {...register("role")}
                      type="radio"
                      value="doctor"
                      className="sr-only"
                    />
                    <div
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                        selectedRole === "doctor"
                          ? "border-primary-500 bg-primary-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <User className="w-6 h-6 mx-auto mb-2 text-primary-600" />
                      <div className="text-center">
                        <div className="font-medium">Doctor</div>
                        <div className="text-sm text-gray-500">
                          Manage practice
                        </div>
                      </div>
                    </div>
                  </label>
                </div>
                {errors.role && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.role.message}
                  </p>
                )}
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  {...register("firstName")}
                  label="First Name"
                  placeholder="Enter your first name"
                  error={errors.firstName?.message}
                />
                <Input
                  {...register("lastName")}
                  label="Last Name"
                  placeholder="Enter your last name"
                  error={errors.lastName?.message}
                />
              </div>

              <Input
                {...register("email")}
                type="email"
                label="Email Address"
                placeholder="Enter your email"
                error={errors.email?.message}
                autoComplete="email"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="relative">
                    <Input
                      {...register("password")}
                      type={showPassword ? "text" : "password"}
                      label="Password"
                      placeholder="Enter your password"
                      error={errors.password?.message}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <div className="relative">
                    <Input
                      {...register("confirmPassword")}
                      type={showConfirmPassword ? "text" : "password"}
                      label="Confirm Password"
                      placeholder="Confirm your password"
                      error={errors.confirmPassword?.message}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  {...register("phone")}
                  type="tel"
                  label="Phone Number"
                  placeholder="Enter your phone number"
                  error={errors.phone?.message}
                />
                <Input
                  {...register("dateOfBirth")}
                  type="date"
                  label="Date of Birth"
                  error={errors.dateOfBirth?.message}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender
                </label>
                <select
                  {...register("gender")}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                {errors.gender && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.gender.message}
                  </p>
                )}
              </div>

              {/* Doctor-specific fields */}
              {selectedRole === "doctor" && (
                <div className="space-y-4 border-t pt-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Professional Information
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      {...register("specialization")}
                      label="Specialization"
                      placeholder="e.g., Cardiology, Dermatology"
                      error={errors.specialization?.message}
                    />
                    <Input
                      {...register("licenseNumber")}
                      label="License Number"
                      placeholder="Enter your license number"
                      error={errors.licenseNumber?.message}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      {...register("experience", { valueAsNumber: true })}
                      type="number"
                      label="Years of Experience"
                      placeholder="0"
                      error={errors.experience?.message}
                    />
                    <Input
                      {...register("consultationFee", { valueAsNumber: true })}
                      type="number"
                      label="Consultation Fee ($)"
                      placeholder="0"
                      error={errors.consultationFee?.message}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bio
                    </label>
                    <textarea
                      {...register("bio")}
                      rows={3}
                      className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
                      placeholder="Tell us about your professional background..."
                    />
                    {errors.bio && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.bio.message}
                      </p>
                    )}
                  </div>

                  <Input
                    {...register("languages")}
                    label="Languages (comma-separated)"
                    placeholder="English, Spanish, French"
                    error={errors.languages?.message}
                  />
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                loading={loading}
                disabled={loading}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Create Account
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link
                  href="/auth/login"
                  className="font-medium text-primary-600 hover:text-primary-500"
                >
                  Sign in here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
