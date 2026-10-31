import { SLOT_COUNT } from "@/types";

interface ProgressRingProps {
  completed: number;
  total?: number;
  size?: number;
  stroke?: number;
}

/** Pure SVG ring; renders on the server. Progress = completed / total (8 slots). */
export function ProgressRing({ completed, total = SLOT_COUNT, size = 168, stroke = 14 }: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(completed, total));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / total);

  return (
    <div
      className="relative inline-flex items-center justify-center"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={clamped}
      aria-label={`${clamped} of ${total} meal moments enjoyed today`}
      data-testid="progress-ring"
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={stroke} className="stroke-secondary" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="stroke-primary transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-bold tabular-nums" data-testid="progress-count">
          {clamped}/{total}
        </span>
        <span className="text-xs text-muted-foreground">nourished</span>
      </div>
    </div>
  );
}
