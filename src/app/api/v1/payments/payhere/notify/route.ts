import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { verifyPayhereNotify } from "@/lib/payhere";

export async function POST(req: Request) {
  const form = await req.formData();
  const params = Object.fromEntries(form.entries()) as Record<string, string>;

  const isValid = verifyPayhereNotify({
    merchant_id: params.merchant_id,
    order_id: params.order_id,
    payhere_amount: params.payhere_amount,
    payhere_currency: params.payhere_currency,
    status_code: params.status_code,
    md5sig: params.md5sig,
  });

  const supabase = supabaseAdmin();

  const { data: booking } = await supabase
    .from("bookings")
    .select("id, amount_cents, status")
    .eq("payhere_order_id", params.order_id)
    .single();

  if (!booking) {
    return new NextResponse("booking not found", { status: 404 });
  }

  const expectedAmount = (booking.amount_cents / 100).toFixed(2);
  const amountMatches = expectedAmount === Number(params.payhere_amount).toFixed(2);

  await supabase.from("payments").insert({
    booking_id: booking.id,
    provider: "payhere",
    provider_ref: params.payment_id ?? null,
    amount_cents: Math.round(Number(params.payhere_amount) * 100),
    status: isValid && amountMatches ? "success" : "failed",
    raw: params,
  });

  if (isValid && amountMatches && booking.status !== "paid") {
    await supabase.from("bookings").update({ status: "paid" }).eq("id", booking.id);
  }

  return new NextResponse("ok", { status: 200 });
}
