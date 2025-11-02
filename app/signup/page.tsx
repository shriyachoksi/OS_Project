import { SignupForm } from "@/components/signup-form";

export default async function SignupPage() {
  // Removed server-side auth check (createClient() and getUser()) and redirect.
  // This ensures the page can be statically exported by Next.js.
  // Client-side navigation handles redirects after signup/on dashboard load.

  return (
    <div className="relative min-h-screen overflow-hidden p-4">
      {/* Ambient blobs */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-20 -left-16 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-24 right-0 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
      </div>

      <div className="w-full max-w-md mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gradient">
            EduTrack
          </h1>
          <p className="text-muted-foreground">Your student activity portal</p>
        </div>
        <div className="gradient-border rounded-xl glass">
          <SignupForm />
        </div>
      </div>
    </div>
  );
}
