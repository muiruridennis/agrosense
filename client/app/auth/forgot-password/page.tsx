"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import {
  Mail,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Shield,
  Clock,
  ShieldCheck,
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

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const forgotPassword = useMutation({
    mutationFn: async (data: ForgotPasswordFormData) => {
      const response = await apiClient.post("/password-reset/forgot", data);
      return response.data;
    },
    onSuccess: () => {
      setIsSuccess(true);
      toast.success("Reset link sent! Check your email.");
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || "Failed to send reset link";
      toast.error(message);
    },
  });

  const onSubmit = (data: ForgotPasswordFormData) => {
    forgotPassword.mutate(data);
  };

  if (isSuccess) {
    return <SuccessCard />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted/30 via-background to-muted/20 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Card className="relative overflow-hidden shadow-2xl border-muted/50">
          {/* Decorative top bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary/60 via-primary to-primary/60" />

          <CardHeader className="text-center pt-8 pb-6">
            <div className="mx-auto mb-6 relative">
              <div className="rounded-full bg-primary/10 p-4 shadow-lg shadow-primary/10">
                <Shield className="h-10 w-10 text-primary" />
              </div>
            </div>

            <CardTitle className="text-2xl font-bold tracking-tight">
              Forgot Password?
            </CardTitle>

            <CardDescription className="text-base text-muted-foreground max-w-sm mx-auto">
              No worries. Enter your email and we'll send you a reset link.
            </CardDescription>
          </CardHeader>

          <CardContent className="px-6 pb-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Email Address
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="email"
                            placeholder="you@example.com"
                            className="pl-10 h-11"
                            {...field}
                            disabled={forgotPassword.isPending}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full h-11 text-base font-medium shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-shadow"
                  disabled={forgotPassword.isPending}
                >
                  {forgotPassword.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending Reset Link...
                    </>
                  ) : (
                    "Send Reset Link"
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

                <p className="text-center text-xs text-muted-foreground">
                  Need help?{" "}
                  <Link
                    href="/contact"
                    className="text-primary hover:underline font-medium"
                  >
                    Contact Support
                  </Link>
                </p>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


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
              {/* Outer ring pulse effect */}
              <div className="absolute inset-0 rounded-full bg-emerald-400/20 animate-ping" />
              <div className="relative rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/40 dark:to-emerald-800/40 p-4 shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="h-14 w-14 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>

            <CardTitle className="text-2xl font-bold tracking-tight text-emerald-700 dark:text-emerald-400">
              Check Your Email
            </CardTitle>

            <CardDescription className="text-base text-muted-foreground max-w-sm mx-auto">
              We've sent a password reset link to your email address.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 px-6 pb-8">
            {/* Info box */}
            <div className="rounded-xl bg-muted/30 dark:bg-muted/20 p-5 text-center border border-muted/50">
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Link expires in</span>
                  <span className="font-bold text-foreground">30 minutes</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Can only be used</span>
                  <span className="font-bold text-foreground">once</span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-3">
              <Button
                onClick={() => router.push("/login")}
                className="w-full h-11 text-base font-medium shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-shadow"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Login
              </Button>

              <Button
                variant="ghost"
                className="w-full text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
                onClick={() => {
                  toast.info("Resending reset link...");
                  // Add resend logic here
                }}
              >
                Didn't receive the email?
                <span className="ml-1 font-medium text-primary">Resend</span>
              </Button>
            </div>

            {/* Help text */}
            <div className="flex items-center justify-center gap-2 pt-2 text-xs text-muted-foreground">
              <Mail className="h-3.5 w-3.5" />
              <span>Check your spam folder if you don't see the email</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}