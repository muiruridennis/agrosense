// lib/hooks/useEmailVerification.ts
"use client";

import { useMutation } from "@tanstack/react-query";
import { apiClient, ApiError } from "@/lib/api/client";
import { toast } from "sonner";

interface ConfirmEmailResponse {
  message: string;
}

interface ResendConfirmationResponse {
  message: string;
}

export function useConfirmEmail() {
  return useMutation({
    mutationFn: async (token: string): Promise<ConfirmEmailResponse> => {
      const response = await apiClient.post<ConfirmEmailResponse>(
        "/email-verification/confirm",
        { token },
      );
      return response.data;
    },
    onSuccess: (data) => {
      console.log("Email confirmed successfully:", data);
      toast.success(data?.message || "Email confirmed successfully! 🎉");
    },
    onError: (error) => {
      // ✅ error is now either ApiError or some other error
      const message =
        error instanceof ApiError ? error.message : "Failed to confirm email";
      toast.error(message);
    },
  });
}

export function useResendConfirmation() {
  return useMutation({
    mutationFn: async (email: string): Promise<ResendConfirmationResponse> => {
      const response = await apiClient.post<ResendConfirmationResponse>(
        "/email-verification/resend-confirmation-link",
        { email },
      );
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Confirmation link resent! 📧");
    },
    onError: (error) => {
      const message =
        error instanceof ApiError
          ? error.message
          : "Failed to resend confirmation link";
      toast.error(message);
    },
  });
}
