"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PlusCircle, Sprout } from "lucide-react";
import { useRouter } from "next/navigation";

export function EmptyFarmState() {
  const router = useRouter();

  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4">
      <Card className="max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30">
            <Sprout className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl">No Farm Selected</CardTitle>
          <CardDescription>
            You don't have any farms assigned to your account, or you need to
            select one.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            onClick={() => router.push("/farms/create")}
            className="w-full gap-2"
          >
            <PlusCircle className="h-4 w-4" />
            Create a Farm
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/farms")}
            className="w-full"
          >
            View All Farms
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
