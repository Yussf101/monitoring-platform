import type { LucideIcon } from 'lucide-react';
import { cn } from '../lib/utils';

export type StatAccent = 'sky' | 'emerald' | 'amber' | 'rose' | 'indigo';

interface StatTrend {
  label: string;
  isPositive?: boolean;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  accent?: StatAccent;
  trend?: StatTrend;
  className?: string;
  subtitleRight?: string;
}

const accentIconStyles: Record<StatAccent, string> = {
  sky: "border-[#388bfd]/30 bg-[#388bfd]/10 text-[#58a6ff]",
  indigo: "border-[#388bfd]/30 bg-[#388bfd]/10 text-[#58a6ff]",
  emerald: "border-[#3fb950]/30 bg-[#2ea043]/15 text-[#3fb950]",
  amber: "border-[#d29922]/30 bg-[#d29922]/15 text-[#d29922]",
  rose: "border-[#f85149]/30 bg-[#f85149]/15 text-[#f85149]",
};

const accentContourStyles: Record<StatAccent, string> = {
  sky: "contour-accent-blue",
  indigo: "contour-accent-blue",
  emerald: "contour-accent-emerald",
  amber: "contour-accent-amber",
  rose: "contour-accent-rose",
};

export function StatCard({
  title,
  value,
  icon: Icon,
  description,
  accent = 'sky',
  trend,
  className,
  subtitleRight
}: StatCardProps) {
  return (
    <div
      className={cn(
        "linear-card flex flex-col justify-between p-5",
        className
      )}
    >
      <div>
        <div className="flex items-center justify-between pb-2">
          <span className="text-sm font-semibold text-muted-foreground">
            {title}
          </span>
          <div
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-lg border transition-colors",
              accentIconStyles[accent] || accentIconStyles.sky
            )}
            aria-hidden="true"
          >
            <Icon className="h-4 w-4" />
          </div>
        </div>

        <div className="flex items-baseline justify-between pt-1">
          <div className="text-2xl sm:text-3xl font-semibold tabular-nums text-foreground tracking-tight">
            {value}
          </div>
          {subtitleRight && (
            <span className="text-xs font-mono text-muted-foreground">
              {subtitleRight}
            </span>
          )}
        </div>
      </div>

      {(description || trend) && (
        <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/[0.06] dark:border-white/[0.06] border-slate-100 pt-2.5">
          {description && (
            <span 
              className="text-sm text-muted-foreground font-normal leading-[21px] break-words"
              title={description}
            >
              {description}
            </span>
          )}
          {trend && (
            <span
              className={cn(
                "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-mono font-medium shrink-0 border",
                trend.isPositive === false
                  ? "bg-[#f85149]/15 text-[#f85149] border-[#f85149]/30"
                  : "bg-[#2ea043]/15 text-[#3fb950] border-[#3fb950]/30"
              )}
            >
              {trend.label}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
