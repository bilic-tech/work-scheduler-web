import { randomInt } from "node:crypto";
import { cookies } from "next/headers";

import {
  cookieOptions,
  TWO_FACTOR_COOKIE,
} from "@/lib/auth/cookies";
import { hashToken, newToken } from "@/lib/auth/session";
import { query } from "@/lib/db/pool";
import { sendMail } from "@/lib/mail/mailer";
import { normalizeRole, type UserRole } from "@/lib/types";

export const TWO_FACTOR_TTL_SECONDS = 10 * 60;
export const TWO_FACTOR_MAX_ATTEMPTS = 5;
export const TWO_FACTOR_RESEND_SECONDS = 45;

type ChallengeRow = {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  role: string;
  code_hash: string;
  expires_at: string | Date;
  attempts: number;
  consumed_at: string | Date | null;
  sent_at: string | Date;
};

function newOtpCode() {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

function codeHash(token: string, code: string) {
  return hashToken(`${token}:${code}`);
}

function hashesEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return mismatch === 0;
}

export function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  return `${local.slice(0, 1)}***@${domain}`;
}

async function pendingCookieToken() {
  const store = await cookies();
  return store.get(TWO_FACTOR_COOKIE)?.value ?? null;
}

async function loadChallenge(token: string) {
  const result = await query<ChallengeRow>(
    `select c.id, c.user_id, p.email, p.full_name, p.role,
            c.code_hash, c.expires_at, c.attempts, c.consumed_at, c.sent_at
     from two_factor_challenges c
     join profiles p on p.id = c.user_id
     where c.token_hash = $1
     limit 1`,
    [hashToken(token)],
  );
  return result.rows[0] ?? null;
}

export async function beginTwoFactorChallenge(user: {
  id: string;
  email: string;
  full_name: string;
}): Promise<"sent" | "sendFailed"> {
  const token = newToken();
  const code = newOtpCode();

  await query(
    `update two_factor_challenges
     set consumed_at = timezone('utc', now())
     where user_id = $1 and consumed_at is null`,
    [user.id],
  );

  await query(
    `insert into two_factor_challenges
      (user_id, token_hash, code_hash, expires_at, attempts, sent_at)
     values ($1, $2, $3, timezone('utc', now()) + interval '10 minutes', 0, timezone('utc', now()))`,
    [user.id, hashToken(token), codeHash(token, code)],
  );

  const store = await cookies();
  store.set(TWO_FACTOR_COOKIE, token, cookieOptions(TWO_FACTOR_TTL_SECONDS));

  try {
    await sendMail({
      to: user.email,
      subject: "Your Leavewise verification code",
      text: `Hi ${user.full_name},\n\nYour verification code is ${code}.\nIt expires in 10 minutes. If you did not try to sign in, you can ignore this email.`,
    });
    return "sent";
  } catch (error) {
    console.error("2FA email failed", error);
    return "sendFailed";
  }
}

export async function getPendingTwoFactor(): Promise<{
  emailHint: string;
  resendIn: number;
} | null> {
  const token = await pendingCookieToken();
  if (!token) return null;
  const row = await loadChallenge(token);
  if (!row || row.consumed_at) return null;
  if (new Date(row.expires_at).getTime() <= Date.now()) return null;

  const waitMs =
    new Date(row.sent_at).getTime() +
    TWO_FACTOR_RESEND_SECONDS * 1000 -
    Date.now();

  return {
    emailHint: maskEmail(row.email),
    resendIn: Math.max(0, Math.ceil(waitMs / 1000)),
  };
}

export async function clearTwoFactorCookie() {
  const store = await cookies();
  store.delete(TWO_FACTOR_COOKIE);
}

export async function consumePendingTwoFactor() {
  const token = await pendingCookieToken();
  if (token) {
    await query(
      `update two_factor_challenges
       set consumed_at = timezone('utc', now())
       where token_hash = $1 and consumed_at is null`,
      [hashToken(token)],
    );
  }
  await clearTwoFactorCookie();
}

export async function verifyTwoFactorCode(code: string): Promise<
  | { ok: true; userId: string; role: UserRole }
  | { ok: false; error: string }
> {
  const token = await pendingCookieToken();
  if (!token) return { ok: false, error: "otpMissing" };

  const row = await loadChallenge(token);
  if (!row || row.consumed_at) return { ok: false, error: "otpMissing" };
  if (new Date(row.expires_at).getTime() <= Date.now()) {
    return { ok: false, error: "otpExpired" };
  }
  if (row.attempts >= TWO_FACTOR_MAX_ATTEMPTS) {
    return { ok: false, error: "otpLocked" };
  }

  const expected = codeHash(token, code);
  if (!hashesEqual(expected, row.code_hash)) {
    const updated = await query<{ attempts: number }>(
      `update two_factor_challenges
       set attempts = attempts + 1
       where id = $1 and consumed_at is null
       returning attempts`,
      [row.id],
    );
    const attempts = updated.rows[0]?.attempts ?? row.attempts + 1;
    return {
      ok: false,
      error: attempts >= TWO_FACTOR_MAX_ATTEMPTS ? "otpLocked" : "otpInvalid",
    };
  }

  await query(
    `update two_factor_challenges
     set consumed_at = timezone('utc', now())
     where id = $1 and consumed_at is null`,
    [row.id],
  );

  return {
    ok: true,
    userId: row.user_id,
    role: normalizeRole(row.role),
  };
}

export async function resendTwoFactorCode(): Promise<{
  error?: string;
  resendIn?: number;
}> {
  const token = await pendingCookieToken();
  if (!token) return { error: "otpMissing" };

  const row = await loadChallenge(token);
  if (!row || row.consumed_at) return { error: "otpMissing" };
  if (new Date(row.expires_at).getTime() <= Date.now()) {
    return { error: "otpExpired" };
  }

  const waitMs =
    new Date(row.sent_at).getTime() +
    TWO_FACTOR_RESEND_SECONDS * 1000 -
    Date.now();
  if (waitMs > 0) {
    return {
      error: "otpResendWait",
      resendIn: Math.ceil(waitMs / 1000),
    };
  }

  const code = newOtpCode();
  await query(
    `update two_factor_challenges
     set code_hash = $1,
         expires_at = timezone('utc', now()) + interval '10 minutes',
         attempts = 0,
         sent_at = timezone('utc', now())
     where id = $2`,
    [codeHash(token, code), row.id],
  );

  try {
    await sendMail({
      to: row.email,
      subject: "Your Leavewise verification code",
      text: `Hi ${row.full_name},\n\nYour verification code is ${code}.\nIt expires in 10 minutes. If you did not try to sign in, you can ignore this email.`,
    });
  } catch (error) {
    console.error("2FA email failed", error);
    return { error: "otpSendFailed" };
  }

  return { resendIn: TWO_FACTOR_RESEND_SECONDS };
}
