import { JetBrains_Mono, Manrope, Fraunces } from "next/font/google";
import { ThemeProvider } from "@/providers/theme-provider";
import {
  ConditionalNavbar,
  ConditionalFooter,
} from "@/components/conditional-navbar";
import "./globals.css";
import { cn } from "@/lib/utils";
import { QueryProvider } from "@/providers/query-provider";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/providers/auth-provider";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "AgroSense - Smart Farming for Modern Agriculture",
  description: "AI-powered farm management platform for African farmers",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`
          ${manrope.variable}
          ${fraunces.variable}
          ${jetbrainsMono.variable}
        `}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <AuthProvider>
              <div className="min-h-screen flex flex-col">
                <ConditionalNavbar />
                <main className="flex-1">{children}</main>
                <Toaster position="top-right" />
                <ConditionalFooter />
              </div>
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
