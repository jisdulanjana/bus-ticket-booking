import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET() {
  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("trips")
    .select("id, origin, destination, depart_at, price_cents, status, buses(id, name, seat_count, layout)")
    .eq("status", "open")
    .order("depart_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: { code: "trips_fetch_failed", message: error.message } }, { status: 500 });
  }
  return NextResponse.json({ trips: data });
}
