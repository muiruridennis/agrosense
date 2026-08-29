// src/components/layout/public-navbar.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Bird, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  children?: NavItem[];
}

// Poultry-focused navigation
const publicNavItems: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Features", href: "/features" },
  { label: "Market", href: "/market" },
  { label: "Pricing", href: "/pricing" },
  { label: "Resources", href: "/resources" },
];

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const themeIcon = mounted ? (
    theme === "dark" ? (
      <Sun className="w-4 h-4" />
    ) : (
      <Moon className="w-4 h-4" />
    )
  ) : (
    <Sun className="w-4 h-4" />
  );

  return (
    <header
      className={cn(
        "fixed top-0 w-full z-100 transition-all duration-300",
        isScrolled
          ? "bg-background/95 backdrop-blur-md border-b border-border/50 shadow-sm"
          : "bg-background border-b border-border/50",
      )}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* ========================================
              LOGO
          ======================================== */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-500 shadow-md shadow-amber-400/25 transition-transform duration-300 group-hover:scale-105">
              <Bird className="h-4.5 w-4.5 text-[#070B14]" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-foreground">
                Agro<span className="text-amber-400">Sense</span>
              </span>
              <span className="hidden rounded-full bg-amber-400/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-400/80 lg:inline-block">
                Poultry
              </span>
            </div>
          </Link>

          {/* ========================================
              DESKTOP NAVIGATION
          ======================================== */}
          <div className="hidden lg:flex items-center gap-1">
            {publicNavItems.map((item) => {
              const isActive =
                pathname === item.href || pathname?.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group relative px-3.5 py-2 text-sm font-medium transition-colors duration-200",
                    isActive
                      ? "text-foreground"
                      : "text-foreground/70 hover:text-foreground",
                  )}
                >
                  <span className="relative z-10">{item.label}</span>

                  {/* Active indicator */}
                  {isActive && (
                    <span className="absolute bottom-1 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-amber-400" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* ========================================
              RIGHT ACTIONS
          ======================================== */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="h-9 w-9 rounded-lg text-foreground/70 hover:text-foreground hover:bg-muted transition-all duration-200 hover:scale-105 active:scale-95"
              aria-label="Toggle theme"
            >
              {themeIcon}
            </button>

            {/* Desktop CTA Buttons */}
            <div className="hidden lg:flex items-center gap-2">
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-muted rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-5 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-200 hover:scale-105 active:scale-95 shadow-md shadow-primary/20"
              >
                Start Free Trial
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden h-9 w-9 rounded-lg text-foreground/70 hover:text-foreground hover:bg-muted transition-all duration-200 hover:scale-105 active:scale-95"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 mx-auto" />
              ) : (
                <Menu className="w-5 h-5 mx-auto" />
              )}
            </button>
          </div>
        </div>

        {/* ========================================
            MOBILE MENU
        ======================================== */}
        {isMobileMenuOpen && (
          <div className="lg:hidden absolute left-0 right-0 top-16 bg-background/95 backdrop-blur-md border-b border-border/50 shadow-lg animate-fade-in z-[101]">
            <div className="container mx-auto px-4 py-4">
              <div className="flex flex-col gap-1">
                {publicNavItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "px-4 py-3 text-base font-medium rounded-lg transition-all duration-200",
                        "hover:scale-[1.02] active:scale-[0.98]",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-foreground/70 hover:text-foreground hover:bg-muted",
                      )}
                    >
                      {item.label}
                    </Link>
                  );
                })}

                <hr className="my-2 border-border/50" />

                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-4 py-3 text-base font-medium text-center text-foreground/70 hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-4 py-3 text-base font-semibold text-center bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Start Free Trial
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default Navbar;
