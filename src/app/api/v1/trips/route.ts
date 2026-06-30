import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const origin = searchParams.get("origin");
  const destination = searchParams.get("destination");

  const supabase = supabaseAdmin();
  let query = supabase
    .from("trips")
    .select("id, origin, destination, depart_at, price_cents, status, buses(id, name, seat_count, layout)")
    .eq("status", "open")
    .order("depart_at", { ascending: true });

  if (date) {
    const start = new Date(`${date}T00:00:00Z`);
    const end = new Date(`${date}T23:59:59.999Z`);
    query = query.gte("depart_at", start.toISOString()).lte("depart_at", end.toISOString());
  }
  if (origin) query = query.eq("origin", origin);
  if (destination) query = query.eq("destination", destination);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: { code: "trips_fetch_failed", message: error.message } }, { status: 500 });
  }
  return NextResponse.json({ trips: data });
}
