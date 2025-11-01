import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/server";

/**
 * Server API route: ensure the authenticated user has a profiles row.
 * Uses the Supabase Service Role key via the REST API to upsert the profile.
 * This avoids RLS restrictions for client-side upserts.
 */
export async function POST() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRole) {
    return NextResponse.json(
      { error: "Missing Supabase URL or service role key on server." },
      { status: 500 }
    );
  }

  try {
    const serverSupabase = await createServerClient();
    const {
      data: { user },
    } = await serverSupabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const payload = [
      {
        id: user.id,
        email: user.email,
        full_name: (user.user_metadata && user.user_metadata.full_name) || null,
      },
    ];

    const res = await fetch(`${supabaseUrl}/rest/v1/profiles`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: serviceRole,
        Authorization: `Bearer ${serviceRole}`,
        Prefer: "return=representation",
      },
      body: JSON.stringify(payload),
    });

    const body = await res.json().catch(() => null);

    if (!res.ok) {
      return NextResponse.json(
        { error: body || "Failed to create profile" },
        { status: res.status }
      );
    }

    return NextResponse.json({ data: body }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
