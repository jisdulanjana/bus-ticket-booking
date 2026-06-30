import { cookies } from "next/headers";
import crypto from "crypto";

const COOKIE_NAME = "admin_session";

function sessionToken() {
  return crypto.createHash("sha256").update(process.env.ADMIN_PASSWORD ?? "").digest("hex");
}

export async function isAdminAuthed() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  return Boolean(process.env.ADMIN_PASSWORD) && token === sessionToken();
}

export async function setAdminSession() {
  const store = await cookies();
  store.set(COOKIE_NAME, sessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function clearAdminSession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
