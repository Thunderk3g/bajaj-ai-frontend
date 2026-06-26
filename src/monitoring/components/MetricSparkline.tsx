import { useId } from "react";

interface MetricSparklineProps {
  /** Rolling series of values (oldest → newest). */
  data: number[];
  /** Fixed upper bound for the y-axis; auto-scales to the max when omitted. */
  max?: number;
  width?: number;
  height?: number;
  /** Tailwind text color class for the stroke (defaults to brand). */
  className?: string;
  label?: string;
}

/**
 * Hand-rolled inline-SVG sparkline (no chart library). Draws a single brand
 * line with a soft gradient fill. Scales to the series max (or a fixed `max`).
 */
export function MetricSparkline({
  data,
  max,
  width = 160,
  height = 40,
  className = "text-brand",
  label,
}: MetricSparklineProps) {
  const gradId = useId();
  const pad = 2;
  const w = width;
  const h = height;

  if (data.length === 0) {
    return (
      <svg
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        className={className}
        role="img"
        aria-label={label ? `${label}: no data yet` : "no data yet"}
      >
        <line
          x1={pad}
          y1={h / 2}
          x2={w - pad}
          y2={h / 2}
          stroke="currentColor"
          strokeOpacity={0.18}
          strokeDasharray="3 4"
        />
      </svg>
    );
  }

  const peak = Math.max(max ?? 0, ...data, 1e-6);
  const n = data.length;
  const stepX = n > 1 ? (w - pad * 2) / (n - 1) : 0;
  const y = (v: number) => {
    const clamped = Math.max(0, Math.min(peak, v));
    return h - pad - (clamped / peak) * (h - pad * 2);
  };
  const x = (i: number) => pad + i * stepX;

  const points = data.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`);
  const linePath = `M ${points.join(" L ")}`;
  const areaPath = `${linePath} L ${x(n - 1).toFixed(1)},${h - pad} L ${x(0).toFixed(
    1,
  )},${h - pad} Z`;
  const last = data[n - 1];

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className={className}
      role="img"
      aria-label={label ? `${label} trend, latest ${last.toFixed(1)}` : undefined}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity={0.22} />
          <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradId})`} stroke="none" />
      <path
        d={linePath}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {n > 0 && (
        <circle cx={x(n - 1)} cy={y(last)} r={2.4} fill="currentColor" />
      )}
    </svg>
  );
}
