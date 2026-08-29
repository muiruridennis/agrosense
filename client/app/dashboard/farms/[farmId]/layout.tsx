"use client";

import { useParams } from "next/navigation";
import { FarmContextBar } from "./components/FarmContextBar";
import { FarmSidebar } from "./components/FarmSidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { useFarm } from "../hooks/useFarms";
import { useAuth } from "@/providers/auth-provider";
import { FarmMemberRole } from "@/types";
import { FarmRoleProvider } from "@/providers/FarmRoleContext";

export default function FarmLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { farmId } = useParams();
  const { user } = useAuth();
  const { data: farm, isLoading } = useFarm(farmId as string);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-full" />
        <div className="flex gap-6">
          <Skeleton className="h-[calc(100vh-120px)] w-64" />
          <Skeleton className="flex-1" />
        </div>
      </div>
    );
  }

  if (!farm) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Farm not found</h2>
          <p className="text-sm text-muted-foreground mt-1">
            The farm you're looking for doesn't exist or you don't have access.
          </p>
        </div>
      </div>
    );
  }
  // ✅ Determine the user's role for this farm
  const membership = farm.members?.find((m) => m.userId === user?.id);
  const userRole = membership?.role || FarmMemberRole.WORKER;

  return (
    <FarmRoleProvider role={userRole} farmId={farm.id}>
      <div className="space-y-5">
        <FarmContextBar farm={farm}  userRole={userRole} />
        <div className="flex gap-6">
          <FarmSidebar farmId={farm.id} role={userRole} />
          <div className="flex-1 min-w-0">{children}</div>
        </div>
      </div>
    </FarmRoleProvider>
  );
}
