import type { UserRole } from "@/lib/types";

export const SESSION_COOKIE = "lw_session";
export const ROLE_COOKIE = "lw_role";
export const TWO_FACTOR_COOKIE = "lw_2fa";
export const SESSION_DAYS = 14;

const encoder = new TextEncoder();

function bytesToHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function sessionSecret() {
  return (
    process.env.SESSION_SECRET ||
    "leavewise-local-dev-session-secret-do-not-use-in-prod"
  );
}

export async function signSessionPayload(token: string, role: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(sessionSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(`${token}:${role}`),
  );
  return bytesToHex(signature);
}

export async function parseSessionCookies(
  sessionValue: string | undefined,
  roleValue: string | undefined,
) {
  if (!sessionValue || !roleValue) return null;
  const [role, signature] = roleValue.split(".");
  if (!role || !signature) return null;
  const expected = await signSessionPayload(sessionValue, role);
  if (expected.length !== signature.length) return null;
  let mismatch = 0;
  for (let index = 0; index < expected.length; index += 1) {
    mismatch |= expected.charCodeAt(index) ^ signature.charCodeAt(index);
  }
  if (mismatch !== 0) return null;
  if (role !== "employee" && role !== "manager" && role !== "accounting") {
    return null;
  }
  return { token: sessionValue, role: role as UserRole };
}

export function cookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true as const,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeSeconds,
  };
}
