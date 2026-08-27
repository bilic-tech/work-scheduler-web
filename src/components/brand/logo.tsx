import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm shadow-primary/30">
        <svg viewBox="0 0 24 24" className="size-4" fill="none" aria-hidden>
          <path
            d="M7 4.5h10c.8 0 1.5.7 1.5 1.5v3.2c0 4.6-3.1 8.6-7.5 10.3C6.6 17.8 3.5 13.8 3.5 9.2V6c0-.8.7-1.5 1.5-1.5h2Z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <path
            d="M8.2 11.2 10.6 13.5 15.8 8.6"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="font-heading text-base font-bold tracking-tight">
        Leavewise
      </span>
    </span>
  );
}
