"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Eye,
  EyeOff,
  ArrowRight,
  Bird,
  Sparkles,
  ShieldCheck,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { apiClient, ApiError } from "@/lib/api/client";
import {
  RegisterFormData,
  registerSchema,
  cleanPhoneNumber,
} from "@/lib/validations/auth";

export default function SignUpPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = (data: RegisterFormData) => {
    startTransition(async () => {
      try {
        const cleanedPhone = cleanPhoneNumber(data.phone);

        await apiClient.post("/auth/register", {
          fullName: data.fullName,
          email: data.email,
          phoneNumber: cleanedPhone,
          password: data.password,
        });

        toast.success("Account created successfully! 🎉", {
          description: "You can now sign in to your dashboard.",
        });

        router.push("/login");
      } catch (error: unknown) {
        if (error instanceof ApiError) {
          if (error.statusCode === 409) {
            toast.error(error.message);
            return;
          }
          toast.error(error.message || "Failed to create account.");
          return;
        }
        toast.error("Something went wrong. Please try again.");
      }
    });
  };

  return (
    // ✅ RESTORED: min-h-screen + gradient background
    <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-gradient-to-br from-background via-background to-primary/5">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/2 w-[800px] h-[800px] rounded-full bg-amber-400/[0.03] blur-3xl" />
        <div className="absolute -bottom-1/2 -left-1/2 w-[800px] h-[800px] rounded-full bg-primary/[0.03] blur-3xl" />
      </div>

      <div className="w-full max-w-[440px] relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 shadow-lg shadow-amber-400/25 transition-transform group-hover:scale-105">
              <Bird className="h-6 w-6 text-[#070B14]" />
            </div>
            <div>
              <span className="text-2xl font-bold tracking-tight text-foreground">
                Agro<span className="text-accent">Sense</span>
              </span>
              <span className="ml-1.5 hidden rounded-full bg-amber-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-400 sm:inline-block">
                Poultry
              </span>
            </div>
          </Link>
          <p className="text-sm text-muted-foreground mt-3 flex items-center justify-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            Start your 14-day free trial
          </p>
        </div>

        {/* ✅ RESTORED: Card with backdrop-blur and shadow */}
        <Card className="border-border/50 shadow-xl shadow-black/5 backdrop-blur-sm bg-card/95">
          <CardHeader className="space-y-1.5 pb-6">
            <CardTitle className="text-2xl font-bold text-center tracking-tight">
              Create your account
            </CardTitle>
            <CardDescription className="text-center text-sm">
              Join 2,500+ poultry farmers already using AgroSense
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Full Name */}
              <div className="space-y-1.5">
                <Label htmlFor="fullName" className="text-sm font-medium">
                  Full Name
                </Label>
                <Input
                  id="fullName"
                  placeholder="John Mwangi"
                  className="h-11 rounded-xl border-border/60 bg-background/50 px-4 text-sm focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all duration-200"
                  disabled={isPending}
                  {...register("fullName")}
                />
                {errors.fullName && (
                  <p className="text-sm text-destructive">
                    {errors.fullName.message}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="farmer@example.com"
                  className="h-11 rounded-xl border-border/60 bg-background/50 px-4 text-sm focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all duration-200"
                  disabled={isPending}
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-sm font-medium">
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="0722 000 000"
                  className="h-11 rounded-xl border-border/60 bg-background/50 px-4 text-sm focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all duration-200"
                  disabled={isPending}
                  {...register("phone")}
                />
                {errors.phone && (
                  <p className="text-sm text-destructive">
                    {errors.phone.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Min. 6 characters"
                    className="h-11 rounded-xl border-border/60 bg-background/50 px-4 pr-11 text-sm focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all duration-200"
                    disabled={isPending}
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="confirmPassword"
                  className="text-sm font-medium"
                >
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    className="h-11 rounded-xl border-border/60 bg-background/50 px-4 pr-11 text-sm focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all duration-200"
                    disabled={isPending}
                    {...register("confirmPassword")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-12 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-[#070B14] font-semibold shadow-lg shadow-amber-400/20 hover:shadow-amber-400/30 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] gap-2 group"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[#070B14] border-t-transparent rounded-full animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Start Free Trial
                    <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </>
                )}
              </Button>

              {/* Trust signals */}
              <div className="flex flex-col items-center gap-2 pt-2">
                <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                    No credit card required
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-amber-400" />
                    14-day free trial
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Bird className="h-3.5 w-3.5 text-primary" />
                    Built for poultry
                  </span>
                </div>
              </div>
            </form>
          </CardContent>

          <CardFooter className="flex justify-center border-t border-border/50 pt-6">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-primary hover:text-primary/80 transition-colors hover:underline underline-offset-2"
              >
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}