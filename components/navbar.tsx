"use client";

import * as React from "react";
import { createClient } from "@/lib/client";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Menu, X, LogOut, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [premium, setPremium] = useState<boolean>(() => {
    try {
      if (typeof window === "undefined") return false;
      return localStorage.getItem("premiumTheme") === "1";
    } catch (_) {
      return false;
    }
  });
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const navItems = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/timetable", label: "Timetable" },
    { href: "/assignments", label: "Assignments" },
    { href: "/attendance", label: "Attendance" },
  ];

  // Frosted glass and subtle elevation when scrolled
  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Sync premium theme to document root and localStorage when it changes
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("premium", premium);
    }
    try {
      localStorage.setItem("premiumTheme", premium ? "1" : "0");
    } catch (_) {}
  }, [premium]);

  return (
    <nav
      className={
        "sticky top-0 z-40 transition-all " +
        (scrolled
          ? "border-b border-border/60 bg-card/70 backdrop-blur-md shadow-sm"
          : "border-b border-transparent bg-transparent backdrop-blur-0")
      }
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/dashboard" className="flex items-center gap-3">
            {/* show the full logo on sm+ screens; ensure accessible text for screen readers */}
            <img
              src="/2.png"
              alt="EduTrack Student Portal"
              className="hidden sm:block h-16 md:h-32 mt-2 pr-3"
            />
            <span className="sr-only">EduTrack Student Portal</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={pathname === item.href ? "default" : "ghost"}
                  size="sm"
                  className="rounded-md data-[active=true]:shadow-xs"
                  data-active={pathname === item.href}
                >
                  {item.label}
                </Button>
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-muted/70"
            >
              {isOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <div className="hidden sm:flex items-center gap-3">
              <Button
                variant={premium ? "premium" : "ghost"}
                size="sm"
                onClick={() => {
                  const next = !premium;
                  setPremium(next);
                  try {
                    localStorage.setItem("premiumTheme", next ? "1" : "0");
                  } catch (e) {}
                  document.documentElement.classList.toggle("premium", next);
                }}
                aria-pressed={premium}
                aria-label="Toggle premium theme"
              ></Button>
              <div className="w-8 h-8 rounded-full bg-card/70 flex items-center justify-center text-sm font-medium text-foreground shadow-sm">
                S
              </div>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="gap-2 bg-transparent hover:shadow-xs"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden pb-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
              >
                <Button
                  variant={pathname === item.href ? "default" : "ghost"}
                  size="sm"
                  className="w-full justify-start"
                >
                  {item.label}
                </Button>
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
