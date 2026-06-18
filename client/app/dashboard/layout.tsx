// app/dashboard/layout.tsx
import { DashboardShell } from "./components/dashboard-shell";

export const metadata = {
  title: "Dashboard | AgroSense",
  description: "Farm management dashboard",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell>{children}</DashboardShell>;
}