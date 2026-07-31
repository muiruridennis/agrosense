// app/auth/reset-password/[token]/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  ShieldCheck,
  KeyRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[a-z]/, "Must contain at least one lowercase letter")
      .regex(/[0-9]/, "Must contain at least one number")
      .regex(/[^A-Za-z0-9]/, "Must contain at least one special character"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [isValidating, setIsValidating] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  // Validate token on mount
  useEffect(() => {
    const validateToken = async () => {
      try {
        const response = await apiClient.post("/password-reset/validate", {
          token,
        });
        if (response.data.valid) {
          setIsTokenValid(true);
        } else {
          setValidationError(response.data.message || "Invalid reset link");
        }
      } catch (error: any) {
        setValidationError(
          error?.response?.data?.message || "Invalid or expired reset link"
        );
      } finally {
        setIsValidating(false);
      }
    };

    if (token) {
      validateToken();
    }
  }, [token]);

  const resetPassword = useMutation({
    mutationFn: async (data: ResetPasswordFormData) => {
      const response = await apiClient.post("/password-reset/reset", {
        token,
        password: data.password,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success("Password reset successfully! 🎉");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || "Failed to reset password";
      toast.error(message);
    },
  });

  const onSubmit = (data: ResetPasswordFormData) => {
    resetPassword.mutate(data);
  };

  // ── Loading State ──
  if (isValidating) {
    return <LoadingCard />;
  }

  // ── Invalid Token ──
  if (!isTokenValid) {
    return <InvalidTokenCard error={validationError} />;
  }

  // ── Success State ──
  if (resetPassword.isSuccess) {
    return <SuccessCard />;
  }

  // ── Reset Password Form ──
  return (
    <div className="min-h-screen bg-gradient-to-br from-muted/30 via-background to-muted/20 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Card className="relative overflow-hidden shadow-2xl border-muted/50">
          {/* Decorative top bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary/60 via-primary to-primary/60" />

          <CardHeader className="text-center pt-8 pb-6">
            <div className="mx-auto mb-6 relative">
              <div className="rounded-full bg-primary/10 p-4 shadow-lg shadow-primary/10">
                <KeyRound className="h-10 w-10 text-primary" />
              </div>
            </div>

            <CardTitle className="text-2xl font-bold tracking-tight">
              Set New Password
            </CardTitle>

            <CardDescription className="text-base text-muted-foreground max-w-sm mx-auto">
              Choose a strong password for your AgroSense account
            </CardDescription>
          </CardHeader>

          <CardContent className="px-6 pb-8">
            {/* Password Requirements */}
            <div className="mb-6 rounded-xl bg-muted/30 dark:bg-muted/20 p-4 border border-muted/50">
              <p className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5" />
                Password Requirements:
              </p>
              <ul className="mt-2 grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500">•</span>
                  At least 8 characters
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500">•</span>
                  Uppercase & lowercase
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500">•</span>
                  At least one number
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500">•</span>
                  One special character
                </li>
              </ul>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        New Password
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter new password"
                            className="pl-10 pr-10 h-11"
                            {...field}
                            disabled={resetPassword.isPending}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Confirm Password
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm your password"
                            className="pl-10 pr-10 h-11"
                            {...field}
                            disabled={resetPassword.isPending}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-3 pt-2">
                  <Button
                    type="submit"
                    className="w-full h-11 text-base font-medium shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-shadow"
                    disabled={resetPassword.isPending}
                  >
                    {resetPassword.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Resetting Password...
                      </>
                    ) : (
                      "Reset Password"
                    )}
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        Remember your password?
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    className="w-full text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
                    onClick={() => router.push("/login")}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Login
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Loading Card - Redesigned */
/* ────────────────────────────────────────────────────────────────────────── */

function LoadingCard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-muted/30 via-background to-muted/20 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Card className="relative overflow-hidden shadow-2xl">
          {/* Decorative top bar - subtle pulse */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary/60 via-primary to-primary/60 animate-pulse" />

          <CardHeader className="text-center pt-8 pb-6">
            <div className="mx-auto mb-6 relative">
              <div className="rounded-full bg-primary/10 p-4 shadow-lg shadow-primary/10">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
              </div>
            </div>

            <CardTitle className="text-2xl font-bold tracking-tight">
              Validating Reset Link
            </CardTitle>

            <CardDescription className="text-base text-muted-foreground max-w-sm mx-auto">
              Please wait while we verify your reset link...
            </CardDescription>
          </CardHeader>

          <CardContent className="text-center text-muted-foreground pb-8">
            <div className="flex items-center justify-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce" />
              <div className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:0.2s]" />
              <div className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:0.4s]" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Invalid Token Card - Redesigned */
/* ────────────────────────────────────────────────────────────────────────── */

function InvalidTokenCard({ error }: { error: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-muted/30 via-background to-muted/20 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Card className="relative overflow-hidden shadow-2xl border-red-200 dark:border-red-900/50">
          {/* Decorative top bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-400 via-red-500 to-red-600" />

          <CardHeader className="text-center pt-8 pb-6">
            <div className="mx-auto mb-6 relative">
              <div className="absolute inset-0 rounded-full bg-red-400/20 animate-ping" />
              <div className="relative rounded-full bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/40 dark:to-red-800/40 p-4 shadow-lg shadow-red-500/20">
                <Lock className="h-14 w-14 text-red-600 dark:text-red-400" />
              </div>
            </div>

            <CardTitle className="text-2xl font-bold tracking-tight text-red-700 dark:text-red-400">
              Invalid Reset Link
            </CardTitle>

            <CardDescription className="text-base text-red-600 dark:text-red-300 max-w-sm mx-auto">
              {error || "The reset link is invalid or has expired."}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 px-6 pb-8">
            <p className="text-center text-sm text-muted-foreground">
              Please request a new password reset link from the login page.
            </p>

            <div className="space-y-3">
              <Button asChild className="w-full h-11 text-base font-medium shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-shadow">
                <Link href="/auth/forgot-password">Request New Link</Link>
              </Button>

              <Button
                variant="ghost"
                className="w-full text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
                onClick={() => window.history.back()}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>For security, links expire after 30 minutes</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Success Card - Redesigned */
/* ────────────────────────────────────────────────────────────────────────── */

function SuccessCard() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted/30 via-background to-muted/20 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Card className="relative overflow-hidden shadow-2xl border-emerald-200 dark:border-emerald-900/50">
          {/* Decorative top bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600" />

          <CardHeader className="text-center pt-8 pb-6">
            <div className="mx-auto mb-6 relative">
              <div className="absolute inset-0 rounded-full bg-emerald-400/20 animate-ping" />
              <div className="relative rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/40 dark:to-emerald-800/40 p-4 shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="h-14 w-14 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>

            <CardTitle className="text-2xl font-bold tracking-tight text-emerald-700 dark:text-emerald-400">
              Password Reset!
            </CardTitle>

            <CardDescription className="text-base text-emerald-600 dark:text-emerald-300 max-w-sm mx-auto">
              Your password has been successfully reset.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 px-6 pb-8">
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/20 p-5 text-center border border-emerald-200 dark:border-emerald-800/30">
              <div className="flex flex-col items-center gap-2">
                <ShieldCheck className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                <p className="text-sm text-emerald-700 dark:text-emerald-300">
                  You can now log in with your new password.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => router.push("/login")}
                className="w-full h-11 text-base font-medium shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-shadow"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go to Login
              </Button>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Your account is now more secure</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}