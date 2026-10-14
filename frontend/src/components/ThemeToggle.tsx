import { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Monitor, Check } from 'lucide-react';
import { useTheme, type Theme } from '../context/ThemeContext';
import { cn } from '../lib/utils';

interface ThemeToggleProps {
  className?: string;
  compact?: boolean;
}

export function ThemeToggle({ className, compact = false }: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const options: { label: string; value: Theme; icon: typeof Sun }[] = [
    { label: 'Light', value: 'light', icon: Sun },
    { label: 'Dark', value: 'dark', icon: Moon },
    { label: 'System', value: 'system', icon: Monitor },
  ];

  const CurrentIcon =
    theme === 'system'
      ? Monitor
      : resolvedTheme === 'dark'
      ? Moon
      : Sun;

  if (compact) {
    return (
      <div className={cn("flex items-center gap-1 p-1 rounded-[6px] border border-[#30363d] bg-[#0d1117]", className)}>
        {options.map((opt) => {
          const Icon = opt.icon;
          const isActive = theme === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setTheme(opt.value)}
              title={`${opt.label} theme`}
              aria-label={`${opt.label} theme`}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-1 px-2 text-xs font-medium rounded-[4px] transition-colors",
                isActive
                  ? "bg-[#212830] text-[#f0f6fc] border border-[#30363d] shadow-xs"
                  : "text-[#7d8590] hover:text-[#f0f6fc] hover:bg-[#161b22]"
              )}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn("relative inline-block text-left", className)} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        aria-label="Switch color theme"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        title={`Theme: ${theme} (Alt+T to toggle)`}
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-[6px] border border-[#30363d] bg-[#212620] text-[#7d8590] hover:border-[#8b949e] hover:bg-[#30363d] hover:text-[#f0f6fc] transition-colors shadow-[rgba(61,68,77,0.7)_0px_-1px_0px_0px_inset]",
          isOpen && "border-[#8b949e] bg-[#30363d] text-[#f0f6fc]"
        )}
      >
        <CurrentIcon className={cn(
          "h-4 w-4 transition-transform duration-150",
          resolvedTheme === 'light' ? "text-[#f0883e]" : "text-[#d29922]"
        )} aria-hidden="true" />
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label="Color theme selection"
          className="absolute right-0 z-50 mt-1.5 w-44 rounded-[6px] border border-[#30363d] bg-[#161b22] py-1 shadow-[0_8px_24px_rgba(1,4,9,0.7)] text-[#f0f6fc] select-none animate-in fade-in-50 zoom-in-95 duration-100"
        >
          <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#7d8590] border-b border-[#21262d] mb-1 flex items-center justify-between">
            <span>Theme Mode</span>
            <kbd className="text-[10px] font-mono px-1 py-0.5 bg-[#0d1117] rounded border border-[#30363d] text-[#7d8590]">
              Alt+T
            </kbd>
          </div>

          {options.map((opt) => {
            const Icon = opt.icon;
            const isSelected = theme === opt.value;

            return (
              <button
                key={opt.value}
                type="button"
                role="menuitem"
                onClick={() => {
                  setTheme(opt.value);
                  setIsOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between px-3 py-1.5 text-xs font-medium transition-colors text-left",
                  isSelected
                    ? "bg-[#212830] text-[#f0f6fc] font-semibold"
                    : "text-[#7d8590] hover:bg-[#21262d] hover:text-[#f0f6fc]"
                )}
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{opt.label}</span>
                </div>
                {isSelected && (
                  <Check className="h-3.5 w-3.5 text-[#1f6feb]" aria-hidden="true" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
