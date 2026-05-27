import crypto from "crypto";
import { cookies } from "next/headers";

const adminCookie = "rag_detective_admin_session";

function sign(value: string) {
  return crypto.createHmac("sha256", process.env.SESSION_SECRET ?? "dev-secret").update(value).digest("base64url");
}

export async function createAdminSession() {
  const store = await cookies();
  const value = `admin.${sign("admin")}`;
  store.set(adminCookie, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function hasAdminSession() {
  const store = await cookies();
  const value = store.get(adminCookie)?.value;
  return value === `admin.${sign("admin")}`;
}

export async function clearAdminSession() {
  const store = await cookies();
  store.delete(adminCookie);
}
