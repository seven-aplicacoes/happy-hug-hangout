interface CapacityGaugeProps {
  value: number;            // 0–120+
  label: string;
  sublabel?: string;
  size?: number;
}

/**
 * Gauge circular semicircular para % de ocupação/utilização.
 * Zonas: 0–70 verde · 71–90 amarelo · 91–100 vermelho · >100 vermelho profundo.
 */
export function CapacityGauge({ value, label, sublabel, size = 140 }: CapacityGaugeProps) {
  const pct = Math.max(0, Math.min(120, value));
  const overload = value > 100;
  const color =
    value > 100 ? 'hsl(var(--seven-danger))' :
    value >= 91 ? 'hsl(var(--seven-danger))' :
    value >= 71 ? 'hsl(var(--seven-warning))' :
    'hsl(var(--seven-success))';

  const radius = size / 2 - 12;
  const cx = size / 2;
  const cy = size / 2;
  const circ = Math.PI * radius; // semi-circumference
  // Mapa 0–120 -> 0–circ, mas marca limite em 100
  const dashOffset = circ - (Math.min(100, pct) / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size / 2 + 16} viewBox={`0 0 ${size} ${size / 2 + 16}`}>
        {/* track */}
        <path
          d={`M 12 ${cy} A ${radius} ${radius} 0 0 1 ${size - 12} ${cy}`}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth="10"
          strokeLinecap="round"
        />
        {/* value */}
        <path
          d={`M 12 ${cy} A ${radius} ${radius} 0 0 1 ${size - 12} ${cy}`}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={dashOffset}
          className={overload ? 'animate-pulse' : ''}
        />
        <text
          x={cx}
          y={cy - 2}
          textAnchor="middle"
          className="font-semibold tabular-nums"
          style={{ fontSize: size / 5, fill: color }}
        >
          {Math.round(value)}%
        </text>
      </svg>
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      {sublabel && <p className="text-[11px] text-muted-foreground">{sublabel}</p>}
    </div>
  );
}
