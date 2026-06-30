import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { payhereSignature } from "@/lib/payhere";

const CURRENCY = "LKR";

export async function POST(req: Request) {
  const { booking_id } = (await req.json()) as { booking_id: string };

  if (!booking_id) {
    return NextResponse.json({ error: { code: "invalid_request", message: "booking_id is required" } }, { status: 400 });
  }

  const supabase = supabaseAdmin();
  const { data: booking, error } = await supabase
    .from("bookings")
    .select("id, amount_cents, customer_name, email, phone, status, payhere_order_id")
    .eq("id", booking_id)
    .single();

  if (error || !booking) {
    return NextResponse.json({ error: { code: "booking_not_found", message: "Booking not found" } }, { status: 404 });
  }

  if (booking.status !== "pending") {
    return NextResponse.json({ error: { code: "booking_not_pending", message: "Booking is not pending payment" } }, { status: 409 });
  }

  const orderId = booking.payhere_order_id ?? `bk_${booking.id}`;
  if (!booking.payhere_order_id) {
    await supabase.from("bookings").update({ payhere_order_id: orderId }).eq("id", booking.id);
  }

  const amount = (booking.amount_cents / 100).toFixed(2);
  const hash = payhereSignature(orderId, booking.amount_cents, CURRENCY);
  const [first_name, ...rest] = booking.customer_name.split(" ");

  return NextResponse.json({
    merchant_id: process.env.PAYHERE_MERCHANT_ID,
    return_url: `${process.env.APP_URL}/booking/${booking.id}/success`,
    cancel_url: `${process.env.APP_URL}/booking/${booking.id}/cancelled`,
    notify_url: `${process.env.APP_URL}/api/v1/payments/payhere/notify`,
    order_id: orderId,
    items: `Bus booking ${booking.id}`,
    currency: CURRENCY,
    amount,
    first_name: first_name || "Guest",
    last_name: rest.join(" ") || "Passenger",
    email: booking.email,
    phone: booking.phone ?? "",
    address: "",
    city: "",
    country: "Sri Lanka",
    hash,
  });
}
