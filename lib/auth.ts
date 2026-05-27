import crypto from "crypto";
import { cookies } from "next/headers";

const studentCookie = "rag_detective_student_session";

export type StudentSession = {
  studentId: string;
  registeredStudentId: string;
  name: string;
  email: string;
  rollNumber: string;
};

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET is not configured.");
  }
  return secret;
}

function signPayload(payload: object) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", getSecret())
    .update(encoded)
    .digest("base64url");
  return `${encoded}.${signature}`;
}

function verifyPayload(token: string) {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  const expected = crypto
    .createHmac("sha256", getSecret())
    .update(encoded)
    .digest("base64url");

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

export async function createStudentSession(session: StudentSession) {
  const store = await cookies();
  store.set(studentCookie, signPayload(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function clearStudentSession() {
  const store = await cookies();
  store.delete(studentCookie);
}

export async function getStudentSession(): Promise<StudentSession | null> {
  const store = await cookies();
  const token = store.get(studentCookie)?.value;
  if (!token) return null;

  return (verifyPayload(token) as StudentSession | null) ?? null;
}
