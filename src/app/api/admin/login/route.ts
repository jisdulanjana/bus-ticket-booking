import { NextResponse } from "next/server";
import { setAdminSession } from "@/lib/admin-auth";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const { allowed } = rateLimit(`admin-login:${clientIp(req)}`, 5);
  if (!allowed) {
    return NextResponse.json(
      { error: { code: "rate_limited", message: "Too many attempts, please try again shortly" } },
      { status: 429 }
    );
  }

  const { password } = (await req.json()) as { password: string };

  if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: { code: "invalid_password", message: "Incorrect password" } }, { status: 401 });
  }

  await setAdminSession();
  return NextResponse.json({ ok: true });
}
