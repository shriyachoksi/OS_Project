import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Server-side route that deletes an attendance row using the service role key.
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const id: string | undefined = body?.id;

    if (!id) {
      return NextResponse.json(
        { error: "Missing id in request body" },
        { status: 400 }
      );
    }

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: "Supabase configuration missing on server" },
        { status: 500 }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Perform a soft-delete: update status to 'removed' so client-side sync won't re-create it.
    const { data, error } = await supabase
      .from("attendance")
      .update({ status: "removed" })
      .eq("id", id)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
