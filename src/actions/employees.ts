"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireManager } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/session";
import { mapProfile } from "@/lib/db/mappers";
import { query } from "@/lib/db/pool";
import { appUrl, sendMail } from "@/lib/mail/mailer";
import { managerIds, notifyUsers } from "@/lib/notifications/notify";
import { DEPARTMENTS } from "@/lib/departments";
import type { DbProfile } from "@/lib/types";

const addSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().trim().min(2),
  role: z.enum(["employee", "manager", "accounting"]),
  department: z.enum(DEPARTMENTS),
  annualLeaveAllowance: z.coerce.number().int().min(0).max(365),
});

export async function addEmployeeAction(input: unknown) {
  const parsed = addSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error("Check the form fields and try again.");
  }
  const payload = parsed.data;
  const actor = await requireManager();

  const existing = await query(
    "select id from profiles where lower(email) = lower($1) limit 1",
    [payload.email],
  );
  if (existing.rows[0]) {
    throw new Error("That email is already in use.");
  }

  const inserted = await query<DbProfile>(
    `insert into profiles (email, password_hash, full_name, role, department, annual_leave_allowance)
     values ($1, $2, $3, $4, $5, $6)
     returning *`,
    [
      payload.email.toLowerCase(),
      await hashPassword(payload.password),
      payload.fullName,
      payload.role,
      payload.department,
      payload.annualLeaveAllowance,
    ],
  );
  const person = mapProfile(inserted.rows[0]);

  await notifyUsers({
    userIds: [person.id],
    title: "Your Leavewise account is ready",
    body: `${actor.fullName} added you as ${person.role}.`,
    type: "employee_added",
    href: "/dashboard",
    emails: [
      {
        to: person.email,
        subject: "You were added to Leavewise",
        text: `Hi ${person.fullName},\n\n${actor.fullName} created your ${person.role} account.\nSign in at ${appUrl()}/login with this email and the password they shared with you.`,
      },
    ],
  });

  const otherManagers = (await managerIds()).filter((id) => id !== actor.id);
  if (otherManagers.length) {
    await notifyUsers({
      userIds: otherManagers,
      title: "Teammate added",
      body: `${actor.fullName} added ${person.fullName} (${person.role}).`,
      type: "employee_added",
      href: "/team",
    });
  }

  try {
    await sendMail({
      to: actor.email,
      subject: `${person.fullName} was added to Leavewise`,
      text: `You added ${person.fullName} (${person.email}) as ${person.role}.`,
    });
  } catch (error) {
    console.error("Manager copy email failed", error);
  }

  revalidatePath("/team");
  revalidatePath("/dashboard");
}

export async function removeEmployeeAction(userId: string) {
  const actor = await requireManager();
  if (userId === actor.id) {
    throw new Error("You cannot remove your own account.");
  }

  const result = await query<DbProfile>(
    "select * from profiles where id = $1 limit 1",
    [userId],
  );
  const target = result.rows[0];
  if (!target) throw new Error("Person not found.");

  if (target.role === "manager") {
    const count = await query<{ count: string }>(
      "select count(*)::text as count from profiles where role = 'manager'",
    );
    if (Number(count.rows[0]?.count ?? 0) <= 1) {
      throw new Error("Keep at least one manager on the team.");
    }
  }

  await query("delete from profiles where id = $1", [userId]);

  const remainingManagers = await query<DbProfile>(
    "select * from profiles where role = 'manager'",
  );
  await notifyUsers({
    userIds: remainingManagers.rows.map((row) => row.id),
    title: "Teammate removed",
    body: `${actor.fullName} removed ${target.full_name}.`,
    type: "employee_removed",
    href: "/team",
    emails: remainingManagers.rows.map((row) => ({
      to: row.email,
      subject: "Teammate removed",
      text: `${actor.fullName} removed ${target.full_name} (${target.email}) from Leavewise.`,
    })),
  });

  revalidatePath("/team");
  revalidatePath("/dashboard");
  revalidatePath("/requests");
  revalidatePath("/team-calendar");
  revalidatePath("/reports");
}
