import { redirect } from "next/navigation";

import { AuthShell } from "@/components/auth/login-form";
import { Verify2faForm } from "@/components/auth/verify-2fa-form";
import { getPendingTwoFactor } from "@/lib/auth/two-factor";

export default async function Verify2faPage() {
  const pending = await getPendingTwoFactor();
  if (!pending) {
    redirect("/login");
  }

  return (
    <AuthShell>
      <Verify2faForm emailHint={pending.emailHint} resendIn={pending.resendIn} />
    </AuthShell>
  );
}
