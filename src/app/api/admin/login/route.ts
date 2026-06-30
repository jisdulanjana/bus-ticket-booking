import { NextResponse } from "next/server";
import { setAdminSession } from "@/lib/admin-auth";

export async function POST(req: Request) {
  const { password } = (await req.json()) as { password: string };

  if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: { code: "invalid_password", message: "Incorrect password" } }, { status: 401 });
  }

  await setAdminSession();
  return NextResponse.json({ ok: true });
}
