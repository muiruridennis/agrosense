"use client";

import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";

interface ConfirmEmailResponse {
  success: boolean;
  message: string;
}

interface ResendConfirmationResponse {
  success: boolean;
  message: string;
}

export function useConfirmEmail() {
  return useMutation({
    mutationFn: async (token: string): Promise<ConfirmEmailResponse> => {
      try {
        const response = await apiClient.post<ConfirmEmailResponse>(
          "/email-verification/confirm",
          { token },
        );
        return response.data;
      } catch (error: any) {
        const message =
          error?.response?.data?.message || "Failed to confirm email";
        throw new Error(message);
      }
    },
    onSuccess: (data) => {
      toast.success(data.message || "Email confirmed successfully! 🎉");
    },
    onError: (error: any) => {
      const message = error?.message || "Failed to confirm email";
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
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || "Failed to resend confirmation";
      toast.error(message);
    },
  });
}
