import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

import {
  cookieOptions,
  ROLE_COOKIE,
  SESSION_COOKIE,
  SESSION_DAYS,
  TWO_FACTOR_COOKIE,
  signSessionPayload,
} from "@/lib/auth/cookies";
import { mapProfile } from "@/lib/db/mappers";
import { query } from "@/lib/db/pool";
import type { DbProfile, Profile, UserRole } from "@/lib/types";

const SESSION_SECONDS = SESSION_DAYS * 24 * 60 * 60;

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function newToken() {
  return randomBytes(32).toString("hex");
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export async function createSession(userId: string, role: UserRole) {
  const token = newToken();
  const expires = new Date(Date.now() + SESSION_SECONDS * 1000);
  await query(
    `insert into sessions (user_id, token_hash, expires_at)
     values ($1, $2, $3)`,
    [userId, hashToken(token), expires.toISOString()],
  );
  const store = await cookies();
  store.set(SESSION_COOKIE, token, cookieOptions(SESSION_SECONDS));
  store.set(
    ROLE_COOKIE,
    `${role}.${await signSessionPayload(token, role)}`,
    cookieOptions(SESSION_SECONDS),
  );
  store.delete(TWO_FACTOR_COOKIE);
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await query("delete from sessions where token_hash = $1", [hashToken(token)]);
  }
  store.delete(SESSION_COOKIE);
  store.delete(ROLE_COOKIE);
  store.delete(TWO_FACTOR_COOKIE);
}

export async function getCurrentUser(): Promise<Profile | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const result = await query<DbProfile>(
    `select p.*
     from sessions s
     join profiles p on p.id = s.user_id
     where s.token_hash = $1 and s.expires_at > timezone('utc', now())
     limit 1`,
    [hashToken(token)],
  );
  const row = result.rows[0];
  return row ? mapProfile(row) : null;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}

export async function requireManager() {
  const user = await requireUser();
  if (user.role !== "manager") {
    throw new Error("Only managers can manage people.");
  }
  return user;
}
