# Leavewise

Leave and HR management with role-based access for **Employee**, **Manager**, and **Accounting**. Built with Next.js App Router, TypeScript, Tailwind, shadcn/ui, Postgres, and Mailhog for local email.

There is no demo data. The database starts empty until someone registers.

## Roles

| Role | What you can do |
| --- | --- |
| Employee | Register or sign in, submit leave, see balances and notifications |
| Manager (admin) | Approve or reject requests, company calendar, add and remove people |
| Accounting | Approved-only view, monthly breakdown, CSV / PDF export |

The first person to register becomes the **manager**. Later self-registrations are employees. A manager can still add people with any role.

To change a role later in Postgres (port **5433**, not 5432):

```bash
psql "postgres://leavewise:leavewise@127.0.0.1:5433/leavewise" -c "update profiles set role = 'manager' where email = 'you@company.test';"
```

Valid roles: `employee`, `manager`, `accounting`. After changing a role, sign out and sign in (complete 2FA) so a new session is created.

## Run locally

1. Start Postgres and Mailhog:

```bash
docker compose up -d
```

Postgres: `127.0.0.1:5433` (mapped away from 5432 so it does not clash with another local Postgres)  
Mailhog UI: [http://localhost:8025](http://localhost:8025) · SMTP: `127.0.0.1:1025`

2. Copy env if needed (already set for local Docker):

```bash
DATABASE_URL=postgres://leavewise:leavewise@127.0.0.1:5433/leavewise
SESSION_SECRET=a-long-random-string
APP_URL=http://localhost:3000
SMTP_HOST=127.0.0.1
SMTP_PORT=1025
MAIL_FROM=Leavewise <noreply@leavewise.test>
```

3. Install and start the app:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), register, complete the email code from Mailhog, then use the app.

## Auth, reset, 2FA, and notifications

- Passwords are hashed with bcrypt and stored on `profiles` in Postgres.
- Signing in (and the first session after signup) requires email 2FA: a 6-digit code is sent through Nodemailer → Mailhog (`127.0.0.1:1025`). Open [http://localhost:8025](http://localhost:8025), enter the code on `/verify-2fa`, then a full session cookie is issued. The pending 2FA cookie is not a login.
- Codes are stored hashed in `two_factor_challenges` (10-minute expiry, single use, locked after 5 attempts, resend cooldown ~45s). Password reset stays on its own `/forgot-password` flow.
- Sessions are httpOnly cookies backed by the `sessions` table. Role for the UI is always loaded from `profiles.role` in Postgres, not from a stale cookie.
- In-app notifications sit under the bell in the header. The same events also send email through Mailhog: welcome, new registration, leave submitted/reviewed, teammate added or removed, password reset, 2FA codes.

## Project structure

```
db/schema.sql           Postgres tables (applied on first app query too)
docker-compose.yml      Postgres 16 + Mailhog
src/app/login           Sign in
src/app/signup          Registration
src/app/verify-2fa      Email 2FA code
src/app/forgot-password Password reset request
src/app/reset-password  Password reset form
src/lib/db              pg pool
src/lib/auth            Sessions and cookies
src/lib/mail            Nodemailer → Mailhog
src/actions             Auth, employees, leave
```
