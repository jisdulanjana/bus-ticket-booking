import crypto from "crypto";

export function payhereSignature(orderId: string, amountCents: number, currency: string) {
  const merchantId = process.env.PAYHERE_MERCHANT_ID!;
  const secret = process.env.PAYHERE_MERCHANT_SECRET!;
  const amount = (amountCents / 100).toFixed(2);
  const hashedSecret = crypto.createHash("md5").update(secret).digest("hex").toUpperCase();
  return crypto
    .createHash("md5")
    .update(`${merchantId}${orderId}${amount}${currency}${hashedSecret}`)
    .digest("hex")
    .toUpperCase();
}

export function verifyPayhereNotify(params: {
  merchant_id: string;
  order_id: string;
  payhere_amount: string;
  payhere_currency: string;
  status_code: string;
  md5sig: string;
}) {
  const secret = process.env.PAYHERE_MERCHANT_SECRET!;
  const hashedSecret = crypto.createHash("md5").update(secret).digest("hex").toUpperCase();
  const localSig = crypto
    .createHash("md5")
    .update(
      `${params.merchant_id}${params.order_id}${params.payhere_amount}${params.payhere_currency}${params.status_code}${hashedSecret}`
    )
    .digest("hex")
    .toUpperCase();
  return localSig === params.md5sig.toUpperCase() && params.status_code === "2";
}
