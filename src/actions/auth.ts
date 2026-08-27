"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import {
  createSession,
  destroySession,
  getCurrentUser,
  hashPassword,
  hashToken,
  newToken,
  verifyPassword,
} from "@/lib/auth/session";
import {
  beginTwoFactorChallenge,
  consumePendingTwoFactor,
  resendTwoFactorCode,
  verifyTwoFactorCode,
} from "@/lib/auth/two-factor";
import { mapNotification, mapProfile, mapRequest } from "@/lib/db/mappers";
import { query } from "@/lib/db/pool";
import { appUrl, sendMail } from "@/lib/mail/mailer";
import { notifyUsers } from "@/lib/notifications/notify";
import type {
  AppNotification,
  DbLeaveRequest,
  DbNotification,
  DbProfile,
  LeaveRequest,
  Profile,
} from "@/lib/types";
import { DEPARTMENTS } from "@/lib/departments";
import { visibleRequestsForRole } from "@/lib/rbac";
import { setFlash } from "@/lib/flash";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().trim().min(2),
  department: z.enum(DEPARTMENTS),
});

export async function loginAction(formData: FormData) {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: "invalidLogin" };
  }

  const result = await query<DbProfile>(
    "select * from profiles where lower(email) = lower($1) limit 1",
    [parsed.data.email],
  );
  const row = result.rows[0];
  if (
    !row?.password_hash ||
    !(await verifyPassword(parsed.data.password, row.password_hash))
  ) {
    return { error: "invalidCredentials" };
  }

  await beginTwoFactorAndRedirect(row.id, row.email, row.full_name);
}

async function beginTwoFactorAndRedirect(
  userId: string,
  email: string,
  fullName: string,
) {
  const sent = await beginTwoFactorChallenge({
    id: userId,
    email,
    full_name: fullName,
  });
  await setFlash(sent === "sent" ? "success" : "warning", sent === "sent" ? "otpSent" : "otpSendFailed");
  redirect("/verify-2fa");
}

export async function registerAction(formData: FormData) {
  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    fullName: formData.get("fullName"),
    department: formData.get("department"),
  });
  if (!parsed.success) {
    return {
      error: "fillRegister",
    };
  }

  const existing = await query(
    "select id from profiles where lower(email) = lower($1) limit 1",
    [parsed.data.email],
  );
  if (existing.rows[0]) {
    return { error: "emailTaken" };
  }

  const existingCount = await query<{ count: string }>(
    "select count(*)::text as count from profiles",
  );
  const role =
    Number(existingCount.rows[0]?.count ?? 0) === 0 ? "manager" : "employee";

  const passwordHash = await hashPassword(parsed.data.password);
  const inserted = await query<DbProfile>(
    `insert into profiles (email, password_hash, full_name, role, department, annual_leave_allowance)
     values ($1, $2, $3, $4, $5, $6)
     returning *`,
    [
      parsed.data.email.toLowerCase(),
      passwordHash,
      parsed.data.fullName,
      role,
      parsed.data.department,
      20,
    ],
  );
  const profile = mapProfile(inserted.rows[0]);

  try {
    await sendMail({
      to: profile.email,
      subject: "Welcome to Leavewise",
      text: `Hi ${profile.fullName},\n\nYour account is ready. Sign in at ${appUrl()}/login`,
    });
  } catch (error) {
    console.error("Welcome email failed", error);
  }

  const managers = await query<DbProfile>(
    "select * from profiles where role = 'manager'",
  );
  await notifyUsers({
    userIds: managers.rows.map((row) => row.id),
    title: "New teammate registered",
    body: `${profile.fullName} created a ${profile.role} account.`,
    type: "employee_added",
    href: "/team",
    emails: managers.rows.map((row) => ({
      to: row.email,
      subject: "New teammate registered",
      text: `${profile.fullName} (${profile.email}) just registered as ${profile.role}.`,
    })),
  });

  await beginTwoFactorAndRedirect(profile.id, profile.email, profile.fullName);
}

export async function verifyTwoFactorAction(formData: FormData) {
  const code = String(formData.get("code") ?? "").trim();
  if (!/^\d{6}$/.test(code)) {
    return { error: "otpInvalid" };
  }

  const result = await verifyTwoFactorCode(code);
  if (!result.ok) {
    return { error: result.error };
  }

  await createSession(result.userId, result.role);
  await setFlash("success", "signedIn");
  redirect("/dashboard");
}

export async function resendTwoFactorAction() {
  const result = await resendTwoFactorCode();
  if (result.error) {
    return { error: result.error, resendIn: result.resendIn };
  }
  return { ok: true as const, resendIn: result.resendIn };
}

export async function cancelTwoFactorAction() {
  await consumePendingTwoFactor();
  redirect("/login");
}

export async function requestPasswordResetAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  if (!z.string().email().safeParse(email).success) {
    return { error: "invalidEmail" };
  }

  const result = await query<DbProfile>(
    "select * from profiles where lower(email) = lower($1) limit 1",
    [email],
  );
  const row = result.rows[0];
  if (row) {
    const token = newToken();
    await query(
      `insert into password_reset_tokens (user_id, token_hash, expires_at)
       values ($1, $2, timezone('utc', now()) + interval '1 hour')`,
      [row.id, hashToken(token)],
    );
    const resetUrl = `${appUrl()}/reset-password?token=${token}`;
    try {
      await sendMail({
        to: row.email,
        subject: "Reset your Leavewise password",
        text: `Hi ${row.full_name},\n\nReset your password using this link (expires in 1 hour):\n${resetUrl}`,
      });
    } catch {
      return { error: "resetSendFailed" };
    }
  }

  return { ok: true };
}

export async function resetPasswordAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!token || password.length < 8) {
    return { error: "resetWeak" };
  }

  const result = await query<{
    id: string;
    user_id: string;
    email: string;
    full_name: string;
  }>(
    `select t.id, t.user_id, p.email, p.full_name
     from password_reset_tokens t
     join profiles p on p.id = t.user_id
     where t.token_hash = $1
       and t.used_at is null
       and t.expires_at > timezone('utc', now())
     limit 1`,
    [hashToken(token)],
  );
  const row = result.rows[0];
  if (!row) {
    return { error: "resetInvalid" };
  }

  await query("update profiles set password_hash = $1 where id = $2", [
    await hashPassword(password),
    row.user_id,
  ]);
  await query(
    "update password_reset_tokens set used_at = timezone('utc', now()) where id = $1",
    [row.id],
  );
  await query("delete from sessions where user_id = $1", [row.user_id]);

  try {
    await sendMail({
      to: row.email,
      subject: "Your Leavewise password was changed",
      text: `Hi ${row.full_name},\n\nYour password was reset successfully. If you did not do this, contact your manager.`,
    });
  } catch (error) {
    console.error("Password change email failed", error);
  }

  return { ok: true };
}

export async function signOutAction() {
  await destroySession();
  await setFlash("success", "signedOut");
  redirect("/login");
}

export type BootstrapPayload = {
  currentUser: Profile | null;
  profiles: Profile[];
  requests: LeaveRequest[];
  notifications: AppNotification[];
};

export async function getBootstrapAction(): Promise<BootstrapPayload> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { currentUser: null, profiles: [], requests: [], notifications: [] };
  }

  const [profilesResult, requestsResult, notificationsResult] = await Promise.all([
    query<DbProfile>("select * from profiles order by full_name asc"),
    query<DbLeaveRequest>(
      "select * from leave_requests order by created_at desc",
    ),
    query<DbNotification>(
      `select * from notifications
       where user_id = $1
       order by created_at desc
       limit 40`,
      [currentUser.id],
    ),
  ]);

  const profiles = profilesResult.rows.map(mapProfile);
  const requests = visibleRequestsForRole(
    requestsResult.rows.map(mapRequest),
    currentUser,
  );

  return {
    currentUser,
    profiles,
    requests,
    notifications: notificationsResult.rows.map(mapNotification),
  };
}

export async function markNotificationReadAction(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  await query(
    `update notifications
     set read_at = timezone('utc', now())
     where id = $1 and user_id = $2 and read_at is null`,
    [id, user.id],
  );
}

export async function markAllNotificationsReadAction() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  await query(
    `update notifications
     set read_at = timezone('utc', now())
     where user_id = $1 and read_at is null`,
    [user.id],
  );
}
