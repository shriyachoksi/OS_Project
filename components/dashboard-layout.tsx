"use client";

import type React from "react";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/client";
import { Navbar } from "@/components/navbar";
import { Loader2 } from "lucide-react";
// import { Footer } from "./footer";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // Ensure the server-side profile exists for this user. Fire-and-forget.
      try {
        fetch("/api/create-profile", {
          method: "POST",
          credentials: "same-origin",
        }).then((r) => {
          if (!r.ok) console.warn("create-profile API returned", r.status);
        });
      } catch (e) {
        console.warn("Failed to call create-profile API", e);
      }

      setLoading(false);
    };

    checkAuth();
  }, [router, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <main className="relative min-h-screen overflow-hidden">
        {/* Decorative background layers */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-24 -left-24 h-152 w-152 rounded-full bg-primary/15 blur-3xl" />
          <div className="absolute -top-32 right-0 h-120 w-120 rounded-full bg-accent/20 blur-3xl" />
          <div className="absolute -bottom-40 left-1/2 -translate-x-1/2 h-112 w-240 rounded-[50%] bg-linear-to-r from-primary/20 via-accent/10 to-primary/20 blur-3xl" />
        </div>
        <div className="relative min-h-[calc(100vh-64px)]">{children}</div>
      </main>
      {/* <Footer /> */}
    </>
  );
}
