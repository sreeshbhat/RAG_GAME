import crypto from "crypto";
import { cookies } from "next/headers";

const studentCookie = "rag_detective_student_session";

export type SupportedLlmProvider = "groq" | "openrouter";

export type StudentSession = {
  studentId: string;
  registeredStudentId: string;
  name: string;
  email: string;
  rollNumber: string;
  llmProvider: SupportedLlmProvider;
  llmApiKey: string;
};

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET is not configured.");
  }
  return secret;
}

function getEncryptionKey() {
  return crypto.createHash("sha256").update(getSecret()).digest();
}

function encryptPayload(payload: object) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(payload), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  const encoded = [iv, tag, encrypted].map((part) => part.toString("base64url")).join(".");
  const signature = crypto
    .createHmac("sha256", getSecret())
    .update(encoded)
    .digest("base64url");
  return `${encoded}.${signature}`;
}

function decryptPayload(token: string) {
  const parts = token.split(".");
  if (parts.length !== 4) return null;

  const [ivEncoded, tagEncoded, encryptedEncoded, signature] = parts;
  const encoded = `${ivEncoded}.${tagEncoded}.${encryptedEncoded}`;

  const expected = crypto
    .createHmac("sha256", getSecret())
    .update(encoded)
    .digest("base64url");

  if (signature.length !== expected.length) {
    return null;
  }
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return null;
  }

  try {
    const iv = Buffer.from(ivEncoded, "base64url");
    const tag = Buffer.from(tagEncoded, "base64url");
    const encrypted = Buffer.from(encryptedEncoded, "base64url");
    const decipher = crypto.createDecipheriv("aes-256-gcm", getEncryptionKey(), iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return JSON.parse(decrypted.toString("utf8"));
  } catch {
    return null;
  }
}

export async function createStudentSession(session: StudentSession) {
  const store = await cookies();
  store.set(studentCookie, encryptPayload(session), {
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

  return (decryptPayload(token) as StudentSession | null) ?? null;
}
