"use client";

import { useState } from "react";

import { EyeIcon, EyeOffIcon } from "@/components/icons";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";

export function PasswordInput({
  className,
  id,
  ...props
}: Omit<React.ComponentProps<"input">, "type">) {
  const [visible, setVisible] = useState(false);
  const { m } = useI18n();

  return (
    <div className="flex h-10 items-center overflow-visible rounded-full border border-input bg-white pr-1 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
      <input
        id={id}
        type={visible ? "text" : "password"}
        data-slot="input"
        className={cn(
          "h-full min-w-0 flex-1 rounded-full border-0 bg-transparent px-3.5 text-base outline-none md:text-sm [&::-ms-clear]:hidden [&::-ms-reveal]:hidden [&::-webkit-contacts-auto-fill-button]:hidden [&::-webkit-credentials-auto-fill-button]:hidden",
          className,
        )}
        {...props}
      />
      <button
        type="button"
        className="relative z-20 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm"
        aria-label={visible ? m.auth.hidePassword : m.auth.showPassword}
        onClick={() => setVisible((current) => !current)}
      >
        {visible ? (
          <EyeOffIcon className="size-4" />
        ) : (
          <EyeIcon className="size-4" />
        )}
      </button>
    </div>
  );
}
