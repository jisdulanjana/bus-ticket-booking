import { Resend } from "resend";

type TicketEmailParams = {
  to: string;
  customerName: string;
  bookingId: string;
  seats: string[];
  origin: string;
  destination: string;
  departAt: string;
  amountCents: number;
};

export async function sendTicketEmail(params: TicketEmailParams) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const qrData = encodeURIComponent(`${process.env.APP_URL}/booking/${params.bookingId}`);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrData}`;
  const amount = (params.amountCents / 100).toFixed(2);

  await resend.emails.send({
    from: process.env.RESEND_FROM ?? "onboarding@resend.dev",
    to: params.to,
    subject: `Your bus ticket — ${params.origin} to ${params.destination}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Booking confirmed</h2>
        <p>Hi ${params.customerName}, your seats are booked.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 4px 0; color: #666;">Booking ref</td><td style="text-align: right;">${params.bookingId.slice(0, 8)}</td></tr>
          <tr><td style="padding: 4px 0; color: #666;">Route</td><td style="text-align: right;">${params.origin} → ${params.destination}</td></tr>
          <tr><td style="padding: 4px 0; color: #666;">Departure</td><td style="text-align: right;">${new Date(params.departAt).toLocaleString("en-LK")}</td></tr>
          <tr><td style="padding: 4px 0; color: #666;">Seats</td><td style="text-align: right;">${params.seats.join(", ")}</td></tr>
          <tr><td style="padding: 4px 0; color: #666;">Amount paid</td><td style="text-align: right;">Rs. ${amount}</td></tr>
        </table>
        <img src="${qrUrl}" alt="Booking QR code" width="200" height="200" />
        <p style="color: #666; font-size: 12px;">Show this email or QR code to the conductor when boarding.</p>
      </div>
    `,
  });
}
