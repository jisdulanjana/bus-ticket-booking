import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: { code: "unauthorized", message: "Unauthorized" } }, { status: 401 });
  }

  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("bookings")
    .update({ status: "expired" })
    .eq("status", "pending")
    .lt("hold_expires_at", new Date().toISOString())
    .select("id");

  if (error) {
    return NextResponse.json({ error: { code: "release_failed", message: error.message } }, { status: 500 });
  }

  return NextResponse.json({ released: data?.length ?? 0 });
}
