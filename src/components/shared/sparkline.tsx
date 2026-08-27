import { cn } from "@/lib/utils";

export function Sparkline({
  values,
  className,
}: {
  values: number[];
  className?: string;
}) {
  const max = Math.max(...values, 1);
  const points = values.map((value, index) => {
    const x = values.length === 1 ? 0 : (index / (values.length - 1)) * 100;
    const y = 36 - (value / max) * 32;
    return `${x},${y}`;
  });
  const area = `0,40 ${points.join(" ")} 100,40`;

  return (
    <svg
      viewBox="0 0 100 40"
      className={cn("h-12 w-full", className)}
      aria-hidden
    >
      <polygon points={area} fill="currentColor" opacity="0.16" />
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
