"use client";

import { useEffect } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/client";
import { Loader2 } from "lucide-react";

// This component performs the initial client-side check and redirect.
// It ensures that the root page itself can be statically exported,
// which is required for the Electron build.
export default function Home() {
  const supabase = createClient();

  useEffect(() => {
    const checkUserAndRedirect = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Use client-side redirection if user is authenticated
        redirect("/dashboard");
      } else {
        // Use client-side redirection if user is not authenticated
        redirect("/login");
      }
    };

    checkUserAndRedirect();
  }, [supabase]);

  // Show a simple loading indicator while the client checks auth status
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
