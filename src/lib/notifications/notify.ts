import { sendMail } from "@/lib/mail/mailer";
import { query } from "@/lib/db/pool";
import type { NotificationType } from "@/lib/types";

export async function notifyUsers(input: {
  userIds: string[];
  title: string;
  body: string;
  type: NotificationType;
  href?: string;
  emails?: { to: string; subject: string; text: string }[];
}) {
  const uniqueIds = [...new Set(input.userIds.filter(Boolean))];
  await Promise.all(
    uniqueIds.map((userId) =>
      query(
        `insert into notifications (user_id, title, body, type, href)
         values ($1, $2, $3, $4, $5)`,
        [userId, input.title, input.body, input.type, input.href ?? null],
      ),
    ),
  );

  if (!input.emails?.length) return;
  await Promise.all(
    input.emails.map(async (email) => {
      try {
        await sendMail(email);
      } catch (error) {
        console.error("Mail send failed", error);
      }
    }),
  );
}

export async function managerIds() {
  const result = await query<{ id: string }>(
    "select id from profiles where role = 'manager'",
  );
  return result.rows.map((row) => row.id);
}
