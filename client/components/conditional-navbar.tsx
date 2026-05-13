"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export function ConditionalNavbar() {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith("/dashboard");

  // Hide global navbar in dashboard routes - let dashboard handle its own nav
  if (isDashboard) return null;

  return <Navbar />;
}

export function ConditionalFooter() {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith("/dashboard");

  // Hide footer in dashboard routes - dashboards are full-screen apps
  if (isDashboard) return null;

  return <Footer />;
}
