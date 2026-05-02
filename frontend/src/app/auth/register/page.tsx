"use client";

import { AuthPageLayout } from "@/components/layout/AuthPageLayout";
import Button from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { useAuth } from "@/contexts/AuthContext";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, User, UserPlus } from "lucide-react";
import Link from "next/link";
import { RegisterRequest } from "@/types";
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
      const { confirmPassword, languages, ...rest } = data;

      const registerPayload: RegisterRequest = {
        ...rest,
        ...(languages?.trim()
          ? {
              languages: languages
                .split(",")
                .map((lang) => lang.trim())
                .filter(Boolean),
            }
          : {}),
      };

      await registerUser(registerPayload);
    } catch (error) {
      // Error is handled by the AuthContext
    }
  };

  return (
    <AuthPageLayout
      formWidth="2xl"
      title="One account for patients and providers."
      subtitle="Patients book verified doctors; doctors manage availability and visits—all in a clean, modern workspace."
    >
      <div className="mb-8 text-center lg:text-left">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary-600">
          Create account
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Join CareSlot
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Choose your role and complete the fields below.
        </p>
      </div>

      <Card className="border-white/80 shadow-glow">
        <CardHeader className="pb-2">
          <CardTitle className="text-center text-lg lg:text-left">
            Your details
          </CardTitle>
          <CardDescription className="text-center lg:text-left">
            We use this to personalize your dashboard and booking experience.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                I am a
              </label>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <label className="relative cursor-pointer">
                  <input
                    {...register("role")}
                    type="radio"
                    value="patient"
                    className="sr-only"
                  />
                  <div
                    className={`rounded-2xl border-2 p-4 transition-all ${
                      selectedRole === "patient"
                        ? "border-primary-500 bg-primary-50/90 shadow-soft ring-1 ring-primary-500/20"
                        : "border-border bg-white/60 hover:border-secondary-300"
                    }`}
                  >
                    <User className="mx-auto mb-2 h-6 w-6 text-primary-600" />
                    <div className="text-center">
                      <div className="font-semibold text-foreground">Patient</div>
                      <div className="text-xs text-muted-foreground">
                        Book appointments
                      </div>
                    </div>
                  </div>
                </label>
                <label className="relative cursor-pointer">
                  <input
                    {...register("role")}
                    type="radio"
                    value="doctor"
                    className="sr-only"
                  />
                  <div
                    className={`rounded-2xl border-2 p-4 transition-all ${
                      selectedRole === "doctor"
                        ? "border-primary-500 bg-primary-50/90 shadow-soft ring-1 ring-primary-500/20"
                        : "border-border bg-white/60 hover:border-secondary-300"
                    }`}
                  >
                    <User className="mx-auto mb-2 h-6 w-6 text-primary-600" />
                    <div className="text-center">
                      <div className="font-semibold text-foreground">Doctor</div>
                      <div className="text-xs text-muted-foreground">
                        Manage practice
                      </div>
                    </div>
                  </div>
                </label>
              </div>
              {errors.role && (
                <p className="mt-2 text-sm font-medium text-error-600">
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

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  label="Password"
                  placeholder="••••••••"
                  error={errors.password?.message}
                  autoComplete="new-password"
                  suffix={
                    <button
                      type="button"
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  }
                />
                <Input
                  {...register("confirmPassword")}
                  type={showConfirmPassword ? "text" : "password"}
                  label="Confirm password"
                  placeholder="••••••••"
                  error={errors.confirmPassword?.message}
                  autoComplete="new-password"
                  suffix={
                    <button
                      type="button"
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      aria-label={
                        showConfirmPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  }
                />
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

              <Select
                {...register("gender")}
                label="Gender"
                error={errors.gender?.message}
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </Select>

              {/* Doctor-specific fields */}
              {selectedRole === "doctor" && (
                <div className="space-y-4 rounded-2xl border border-border bg-muted/40 p-4 sm:p-5">
                  <h3 className="text-base font-semibold text-foreground">
                    Professional information
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
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                      Bio
                    </label>
                    <textarea
                      {...register("bio")}
                      rows={3}
                      className="flex w-full rounded-xl border border-input bg-white/90 px-3.5 py-2.5 text-sm text-foreground shadow-inner shadow-black/[0.02] placeholder:text-muted-foreground focus-visible:border-primary-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/50"
                      placeholder="Tell us about your professional background..."
                    />
                    {errors.bio && (
                      <p className="mt-2 text-sm font-medium text-error-600">
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

              <Button type="submit" className="w-full" size="lg" loading={loading}>
                <UserPlus className="h-4 w-4" />
                Create account
              </Button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link
                  href="/auth/login"
                  className="font-semibold text-primary-600 underline-offset-4 hover:text-primary-700 hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
    </AuthPageLayout>
  );
}
