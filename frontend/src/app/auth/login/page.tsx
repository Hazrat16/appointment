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
import { useAuth } from "@/contexts/AuthContext";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, LogIn } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: "onSubmit",
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.email, data.password);
      router.push("/");
    } catch {
      // Error toast handled in AuthContext
    }
  };

  return (
    <AuthPageLayout
      title="Healthcare, without the wait-room hassle."
      subtitle="Book verified providers, manage visits in one place, and keep your care organized from any device."
    >
      <div className="mb-8 text-center lg:text-left">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary-600">
          Welcome back
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Sign in to your account
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Use the email and password you registered with.
        </p>
      </div>

      <Card className="border-white/80 shadow-glow">
        <CardHeader className="pb-2">
          <CardTitle className="text-center text-lg lg:text-left">
            Credentials
          </CardTitle>
          <CardDescription className="text-center lg:text-left">
            Encrypted session · sign out anytime from your dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              {...register("email")}
              type="email"
              label="Email"
              placeholder="you@example.com"
              error={errors.email?.message}
              autoComplete="email"
            />

            <Input
              {...register("password")}
              type={showPassword ? "text" : "password"}
              label="Password"
              placeholder="••••••••"
              error={errors.password?.message}
              autoComplete="current-password"
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

            <Button type="submit" className="w-full" size="lg" loading={loading}>
              <LogIn className="h-4 w-4" />
              Sign in
            </Button>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <span className="bg-card/95 px-3">New here?</span>
              </div>
            </div>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Create an account to book appointments as a patient or list your
              practice as a doctor.{" "}
              <Link
                href="/auth/register"
                className="font-semibold text-primary-600 underline-offset-4 transition-colors hover:text-primary-700 hover:underline"
              >
                Get started
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </AuthPageLayout>
  );
}
