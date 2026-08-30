"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Eye,
  EyeOff,
  ArrowRight,
  Bird,
  Phone,
  Mail,
  Lock,
  Shield,
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
import { useAuth } from "@/providers/auth-provider";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api/client";

// ───────────────────────────────────────────────────────────────
// Zod Schema
// ───────────────────────────────────────────────────────────────

const loginSchema = z.object({
  identifier: z.string().min(1, "Phone or email is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

// ───────────────────────────────────────────────────────────────
// Component
// ───────────────────────────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [identifierType, setIdentifierType] = useState<"phone" | "email">(
    "phone",
  );

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
    setValue,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: "",
      password: "",
    },
  });

  const onSubmit = (data: LoginFormData) => {
    startTransition(async () => {
      try {
        let identifier = data.identifier.trim();

        if (identifierType === "phone") {
          identifier = identifier.replace(/\s/g, "");
          if (identifier.startsWith("0")) {
            identifier = "+254" + identifier.substring(1);
          }
        }

        await login(identifier, data.password);

        toast.success("Welcome back! 🌱", {
          description: "Redirecting to dashboard...",
        });

        router.push("/dashboard");
      } catch (error: unknown) {
        if (error instanceof ApiError) {
          if (error.statusCode === 401) {
            setError("password", {
              type: "manual",
              message: "Invalid phone/email or password",
            });

            toast.error(error.message);
          } else {
            console.error("Login error:", error);
            toast.error(error.message || "Login failed");
          }

          return;
        }

        console.error("Login error:", error);
        toast.error("Something went wrong. Please try again.");
      }
    });
  };

  const toggleIdentifierType = (type: "phone" | "email") => {
    setIdentifierType(type);
    setValue("identifier", "");
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-background">
      <div className="w-full max-w-[400px]">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 shadow-md shadow-amber-400/20">
              <Bird className="h-5 w-5 text-[#070B14]" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">
              Agro<span className="text-accent">Sense</span>
            </span>
          </Link>
          <p className="text-sm text-muted-foreground mt-2">
            Welcome back to your poultry farm
          </p>
        </div>

        {/* Card */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl font-bold">Sign in</CardTitle>
            <CardDescription>
              Use your phone or email to sign in
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Toggle — with improved visibility */}
              <div className="flex gap-1 p-1 bg-muted/50 rounded-lg border border-border/50">
                <button
                  type="button"
                  onClick={() => toggleIdentifierType("phone")}
                  className={cn(
                    "flex-1 py-2.5 rounded-md text-sm font-medium transition-all",
                    "flex items-center justify-center gap-2",
                    identifierType === "phone"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                  )}
                >
                  <Phone
                    className={cn(
                      "h-4 w-4",
                      identifierType === "phone"
                        ? "text-primary-foreground"
                        : "text-muted-foreground",
                    )}
                  />
                  Phone
                </button>
                <button
                  type="button"
                  onClick={() => toggleIdentifierType("email")}
                  className={cn(
                    "flex-1 py-2.5 rounded-md text-sm font-medium transition-all",
                    "flex items-center justify-center gap-2",
                    identifierType === "email"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                  )}
                >
                  <Mail
                    className={cn(
                      "h-4 w-4",
                      identifierType === "email"
                        ? "text-primary-foreground"
                        : "text-muted-foreground",
                    )}
                  />
                  Email
                </button>
              </div>

              {/* Active indicator */}
              <p className="text-xs text-muted-foreground text-center -mt-1.5">
                {identifierType === "phone"
                  ? "📱 Sign in with your phone number"
                  : "✉️ Sign in with your email address"}
              </p>

              {/* Identifier */}
              <div className="space-y-1.5">
                <Label htmlFor="identifier" className="text-sm font-medium">
                  {identifierType === "phone"
                    ? "Phone Number"
                    : "Email Address"}
                </Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60">
                    {identifierType === "phone" ? (
                      <Phone className="h-4 w-4" />
                    ) : (
                      <Mail className="h-4 w-4" />
                    )}
                  </div>
                  <Input
                    id="identifier"
                    type={identifierType === "email" ? "email" : "text"}
                    placeholder={
                      identifierType === "phone"
                        ? "0722 000 000"
                        : "farmer@example.com"
                    }
                    className="pl-9 h-11"
                    {...register("identifier")}
                    disabled={isPending}
                    autoFocus
                  />
                </div>
                {errors.identifier && (
                  <p className="text-sm text-destructive">
                    {errors.identifier.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  <Link
                    href="/auth/forgot-password"
                    className="text-sm font-medium text-primary hover:text-primary/80 hover:underline transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60">
                    <Lock className="h-4 w-4" />
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="pl-9 pr-10 h-11"
                    {...register("password")}
                    disabled={isPending}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-11 bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all"
                disabled={isPending}
              >
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Sign In
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 border-t border-border/50 pt-6">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link
                href="/register"
                className="font-medium text-primary hover:underline"
              >
                Start free trial
              </Link>
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
              <Shield className="h-3.5 w-3.5" />
              <span>Your data is encrypted and secure</span>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
