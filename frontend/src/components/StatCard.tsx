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

export function StatCard({
  title,
  value,
  icon: Icon,
  description,
  accent: _accent = 'sky',
  trend,
  className,
  subtitleRight
}: StatCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col justify-between rounded-[6px] border border-[#30363d] bg-[#161b22] p-4 shadow-[0_1px_0_rgba(27,31,36,0.1)] transition-colors hover:border-[#8b949e]",
        className
      )}
    >
      <div>
        <div className="flex items-center justify-between pb-2">
          <span className="text-sm font-semibold text-[#7d8590]">
            {title}
          </span>
          <div
            className="flex h-7 w-7 items-center justify-center rounded-[6px] border border-[#30363d] bg-[#21262d] text-[#7d8590]"
            aria-hidden="true"
          >
            <Icon className="h-4 w-4" />
          </div>
        </div>

        <div className="flex items-baseline justify-between pt-1">
          <div className="text-2xl sm:text-3xl font-semibold tabular-nums text-[#f0f6fc]">
            {value}
          </div>
          {subtitleRight && (
            <span className="text-xs font-mono text-[#7d8590]">
              {subtitleRight}
            </span>
          )}
        </div>
      </div>

      {(description || trend) && (
        <div className="mt-3 flex items-center justify-between gap-2 border-t border-[#21262d] pt-2.5">
          {description && (
            <span 
              className="text-sm text-[#7d8590] font-normal leading-[21px] break-words"
              title={description}
            >
              {description}
            </span>
          )}
          {trend && (
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium shrink-0 border",
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
