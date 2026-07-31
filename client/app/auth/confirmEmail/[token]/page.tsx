// app/auth/confirmEmail/[token]/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Clock3,
  ShieldCheck,
  Mail,
  ArrowLeft,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  useConfirmEmail,
  useResendConfirmation,
} from "@/lib/hooks/useEmailVerification";

type Status = "loading" | "success" | "expired" | "already" | "error";

export default function ConfirmEmailPage() {
  const { token } = useParams<{ token: string }>();
  const searchParams = useSearchParams();
  const [userEmail, setUserEmail] = useState<string>("");
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [emailInput, setEmailInput] = useState("");

  const confirmEmail = useConfirmEmail();
  const resend = useResendConfirmation();

  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Invalid verification link.");
      return;
    }

    // Try to extract email from token
    const emailFromToken = extractEmailFromToken(token);
    const emailFromQuery = searchParams.get("email");

    const email = emailFromQuery || emailFromToken || "";
    setUserEmail(email);

    confirmEmail.mutate(token, {
      onSuccess: () => {
        setStatus("success");
      },
      onError: (error: any) => {
        const msg =
          error?.response?.data?.message ??
          error?.message ??
          "Unable to verify your email.";

        setMessage(msg);

        if (msg.toLowerCase().includes("expired")) {
          setStatus("expired");
        } else if (msg.toLowerCase().includes("already")) {
          setStatus("already");
        } else {
          setStatus("error");
        }
      },
    });
  }, [token, searchParams]);

  const extractEmailFromToken = (token: string): string | null => {
    try {
      const payload = token.split(".")[1];
      const decoded = JSON.parse(atob(payload));
      return decoded.email || null;
    } catch {
      return null;
    }
  };

  const handleResend = async () => {
    const emailToUse = userEmail || emailInput;
    if (!emailToUse) {
      setShowEmailInput(true);
      return;
    }
    await resend.mutateAsync(emailToUse);
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {status === "loading" && <LoadingCard />}
        {status === "success" && <SuccessCard />}
        {status === "already" && <AlreadyVerifiedCard />}
        {status === "expired" && (
          <ExpiredCard
            message={message}
            email={userEmail}
            showEmailInput={showEmailInput}
            setShowEmailInput={setShowEmailInput}
            emailInput={emailInput}
            setEmailInput={setEmailInput}
            onResend={handleResend}
            isPending={resend.isPending}
            isSuccess={resend.isSuccess}
          />
        )}
        {status === "error" && <ErrorCard message={message} />}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* LOADING CARD                                                             */
/* ────────────────────────────────────────────────────────────────────────── */

function LoadingCard() {
  return (
    <Card className="shadow-lg border-muted">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4">
          <Loader2 className="h-14 w-14 animate-spin text-primary" />
        </div>
        <CardTitle>Verifying your email</CardTitle>
        <CardDescription>
          Please wait while we confirm your email address.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center text-muted-foreground">
        This will only take a few seconds...
      </CardContent>
    </Card>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* SUCCESS CARD                                                              */
/* ────────────────────────────────────────────────────────────────────────── */

function SuccessCard() {
  return (
    <Card className="shadow-lg border-green-200 dark:border-green-900/50">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 p-4">
          <CheckCircle2 className="h-14 w-14 text-green-600 dark:text-green-400" />
        </div>
        <CardTitle className="text-green-700 dark:text-green-400">
          Email verified! 🎉
        </CardTitle>
        <CardDescription>
          Your AgroSense account has been successfully verified.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <p className="text-center text-muted-foreground">
          Welcome to AgroSense!
          <br />
          Your account is now active and ready to use.
        </p>

        <Button asChild className="w-full">
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>

        <Button asChild variant="outline" className="w-full">
          <Link href="/">Back to Home</Link>
        </Button>

        <div className="border-t pt-5 text-center text-sm text-muted-foreground">
          Need help?{" "}
          <Link href="/contact" className="text-primary hover:underline">
            Contact support
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* ALREADY VERIFIED CARD                                                     */
/* ────────────────────────────────────────────────────────────────────────── */

function AlreadyVerifiedCard() {
  return (
    <Card className="shadow-lg border-blue-200 dark:border-blue-900/50">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 rounded-full bg-blue-100 dark:bg-blue-900/30 p-4">
          <ShieldCheck className="h-14 w-14 text-blue-600 dark:text-blue-400" />
        </div>
        <CardTitle className="text-blue-700 dark:text-blue-400">
          Already verified
        </CardTitle>
        <CardDescription>
          Your email address has already been verified.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <p className="text-center text-muted-foreground">
          You can sign in and continue using AgroSense.
        </p>

        <Button asChild className="w-full">
          <Link href="/login">Sign In</Link>
        </Button>

        <Button asChild variant="outline" className="w-full">
          <Link href="/">Back to Home</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* EXPIRED CARD                                                              */
/* ────────────────────────────────────────────────────────────────────────── */

function ExpiredCard({
  message,
  email,
  showEmailInput,
  setShowEmailInput,
  emailInput,
  setEmailInput,
  onResend,
  isPending,
  isSuccess,
}: {
  message: string;
  email: string;
  showEmailInput: boolean;
  setShowEmailInput: (show: boolean) => void;
  emailInput: string;
  setEmailInput: (email: string) => void;
  onResend: () => Promise<void>;
  isPending: boolean;
  isSuccess: boolean;
}) {
  const [resent, setResent] = useState(false);

  const handleResend = async () => {
    await onResend();
    setResent(true);
    setTimeout(() => setResent(false), 60000);
  };

  return (
    <Card className="shadow-lg border-amber-200 dark:border-amber-900/50">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 rounded-full bg-amber-100 dark:bg-amber-900/30 p-4">
          <Clock3 className="h-14 w-14 text-amber-600 dark:text-amber-400" />
        </div>
        <CardTitle className="text-amber-700 dark:text-amber-400">
          Verification link expired
        </CardTitle>
        <CardDescription className="text-amber-600 dark:text-amber-300">
          {message || "Your verification link has expired."}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <p className="text-center text-muted-foreground">
          Verification links expire after 6 hours for security.
          Request a new verification email below.
        </p>

        {/* Email input if no email available */}
        {showEmailInput && (
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Enter the email address you used to sign up.
            </p>
          </div>
        )}

        {/* Resend button */}
        <Button
          onClick={handleResend}
          disabled={isPending || resent}
          className="w-full"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : resent || isSuccess ? (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Email Sent! Check your inbox
            </>
          ) : (
            <>
              <Mail className="mr-2 h-4 w-4" />
              Resend Verification Email
            </>
          )}
        </Button>

        {/* Show email input toggle */}
        {!email && !showEmailInput && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground"
            onClick={() => setShowEmailInput(true)}
          >
            Enter email address manually
          </Button>
        )}

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">or</span>
          </div>
        </div>

        <Button asChild variant="outline" className="w-full">
          <Link href="/login">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Login
          </Link>
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          Having trouble?{" "}
          <Link href="/contact" className="text-primary hover:underline">
            Contact support
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* ERROR CARD                                                                */
/* ────────────────────────────────────────────────────────────────────────── */

function ErrorCard({ message }: { message: string }) {
  return (
    <Card className="shadow-lg border-red-200 dark:border-red-900/50">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 p-4">
          <XCircle className="h-14 w-14 text-red-600 dark:text-red-400" />
        </div>
        <CardTitle className="text-red-700 dark:text-red-400">
          Verification failed
        </CardTitle>
        <CardDescription>
          The verification link is invalid or could not be processed.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <p className="text-center text-muted-foreground">
          {message || "Something went wrong. Please try again."}
        </p>

        <Button asChild variant="outline" className="w-full">
          <Link href="/login">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Login
          </Link>
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          Still having issues?{" "}
          <Link href="/contact" className="text-primary hover:underline">
            Contact support
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}