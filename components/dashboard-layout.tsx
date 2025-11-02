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

      // Ensure the user's profile exists, using Electron IPC instead of the API route.
      // This logic previously used Next.js API Route /api/create-profile.
      if (
        typeof window !== "undefined" &&
        window.electron?.supabase?.createProfile
      ) {
        try {
          // Fire-and-forget IPC call to create/upsert the profile via service role
          // Build a payload that matches the IPC's expected shape so `email` is always a string
          const profilePayload = {
            id: user.id,
            email: user.email ?? "",
            user_metadata: {
              // prefer metadata from the user object if present, otherwise empty string
              full_name:
                ((user as any).user_metadata &&
                  (user as any).user_metadata.full_name) ||
                "",
            },
          };
          window.electron.supabase
            .createProfile(profilePayload)
            .then((res: any) => {
              if (res?.error)
                console.warn("IPC create-profile returned error:", res.error);
            });
        } catch (e) {
          console.warn("Failed to call electron createProfile IPC:", e);
        }
      } else {
        // Fallback for non-Electron environment (e.g., initial web dev setup)
        // In the final desktop app, this block shouldn't be reached if preload.js is correct.
        console.warn(
          "Electron IPC bridge not available for createProfile. Skipping profile creation attempt."
        );
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
