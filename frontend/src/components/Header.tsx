import { useState, useEffect, useRef } from 'react';
import {
  RefreshCw,
  Search,
  ExternalLink,
  CheckCircle2,
  Server,
  AlertTriangle,
  Radio,
  LayoutDashboard,
  Menu,
  BarChart3
} from 'lucide-react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { getHealth } from '../lib/api';
import { PulseLogo } from './PulseLogo';
import { ThemeToggle } from './ThemeToggle';

interface HeaderProps {
  autoRefreshInterval: number;
  onAutoRefreshChange: (interval: number) => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
  totalTargets?: number;
  firingAlerts?: number;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onToggleSidebar?: () => void;
}

export function Header({
  autoRefreshInterval,
  onAutoRefreshChange,
  onRefresh,
  isRefreshing = false,
  totalTargets = 0,
  firingAlerts = 0,
  searchQuery = '',
  onSearchChange,
  onToggleSidebar,
}: HeaderProps) {
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;
    const checkApi = async () => {
      try {
        await getHealth();
        if (isMounted) setApiOnline(true);
      } catch {
        if (isMounted) setApiOnline(false);
      }
    };
    checkApi();
    const interval = setInterval(checkApi, 20000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Keyboard shortcut '/' to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA' &&
        onSearchChange
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSearchChange]);

  const navTabs = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Targets', href: '/targets', icon: Server, count: totalTargets },
    { name: 'Alerts', href: '/alerts', icon: AlertTriangle, count: firingAlerts, isAlert: firingAlerts > 0 },
    { name: 'Discovery', href: '/discovery', icon: Radio },
  ];

  return (
    <header className="sticky top-0 z-30 w-full bg-card dark:bg-[#121212] border-b border-border select-none" role="banner">
      {/* Top Global Bar */}
      <div className="flex h-14 items-center justify-between px-4 sm:px-6 gap-3">
        {/* Left: Branding & Breadcrumbs */}
        <div className="flex items-center gap-3 min-w-0">
          {onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              aria-label="Toggle navigation drawer"
              className="flex h-8 w-8 items-center justify-center rounded-[6px] border border-border bg-secondary dark:bg-[#212830] text-muted-foreground hover:border-[#8b949e] hover:bg-muted dark:hover:bg-[#30363d] hover:text-foreground transition-colors shadow-xs"
            >
              <Menu className="h-4 w-4" aria-hidden="true" />
            </button>
          )}

          {/* Platform Branding - logo and title */}
          <Link to="/dashboard" className="flex items-center gap-2.5 group shrink-0 py-1">
            <PulseLogo className="h-10 w-10 shrink-0 transition-transform group-hover:scale-101" />
            <span className="text-[17px] font-semibold text-foreground tracking-tight group-hover:text-foreground dark:group-hover:text-white transition-colors">
              Monitoring Platform
            </span>
          </Link>
        </div>

        {/* Center / Right: Filter, Telemetry Indicators & Controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Search Input (14px text-sm, 32px height) */}
          {onSearchChange ? (
            <div className="relative w-48 sm:w-64">
              <Search
                className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Type / to search..."
                aria-label="Search and filter infrastructure targets and alerts"
                className="h-8 w-full rounded-[6px] border border-border bg-background pl-8 pr-7 text-sm leading-[20px] text-foreground placeholder:text-muted-foreground focus:border-[#e5484d] focus:outline-none focus:ring-1 focus:ring-[#e5484d] font-sans transition-colors"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  aria-label="Clear search input"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              ) : (
                <kbd className="absolute right-2 top-1/2 -translate-y-1/2 hidden sm:inline-block px-1.5 py-0.2 text-[10px] font-mono text-muted-foreground bg-card rounded border border-border">
                  /
                </kbd>
              )}
            </div>
          ) : null}

          {/* Quick status counters (14px, 32px height, 500 weight) */}
          <div className="hidden lg:flex items-center gap-1.5 text-sm">
            <Link
              to="/alerts"
              aria-label={`${firingAlerts} Firing Alerts`}
              className={`flex items-center gap-1.5 h-8 px-3 py-1 rounded-[6px] border transition-colors text-sm font-medium shadow-[rgba(61,68,77,0.7)_0px_-1px_0px_0px_inset] ${firingAlerts > 0
                  ? 'bg-[#e5484d]/15 border-[#e5484d]/40 text-[#e5484d] hover:bg-[#e5484d]/25 font-semibold shadow-[0_0_10px_rgba(229,72,77,0.25)]'
                  : 'bg-secondary hover:bg-muted border-border text-foreground hover:text-white'
                }`}
            >
              {firingAlerts > 0 ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500"></span>
                  </span>
                  <span>{firingAlerts} Firing</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" aria-hidden="true" />
                  <span>0 Firing</span>
                </>
              )}
            </Link>
          </div>

          {/* API Health */}
          <div
            className="flex items-center gap-1.5 h-8 px-2.5 py-1 rounded-[6px] bg-card border border-border text-xs"
            role="status"
            aria-live="polite"
          >
            <span className="relative flex h-2 w-2">
              {apiOnline === true && (
                <span className="inline-flex h-2 w-2 rounded-full bg-[#3fb950]" />
              )}
              {apiOnline === false && (
                <span className="inline-flex h-2 w-2 rounded-full bg-[#f85149] animate-ping" />
              )}
              {apiOnline === null && (
                <span className="inline-flex h-2 w-2 rounded-full bg-[#d29922] animate-pulse" />
              )}
            </span>
            <span className="text-xs font-medium text-muted-foreground hidden sm:inline">
              {apiOnline === true ? 'API Connected' : apiOnline === false ? 'API Offline' : 'Connecting...'}
            </span>
          </div>

          {/* Refresh Controls */}
          <div className="flex items-center h-8 rounded-[6px] border border-border bg-secondary shadow-[rgba(61,68,77,0.7)_0px_-1px_0px_0px_inset]">
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              aria-label="Refresh telemetry data now"
              title="Refresh telemetry data now"
              className="flex h-8 w-8 items-center justify-center text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-[#4493f8]' : ''}`} aria-hidden="true" />
            </button>
            <div className="h-4 w-[1px] bg-border" />
            <select
              value={autoRefreshInterval}
              onChange={(e) => onAutoRefreshChange(Number(e.target.value))}
              aria-label="Auto-refresh rate"
              className="h-8 bg-transparent px-2 text-xs font-medium text-foreground hover:text-white focus:outline-none cursor-pointer"
              title="Auto-refresh rate"
            >
              <option value={10} className="bg-card text-foreground">10s</option>
              <option value={30} className="bg-card text-foreground">30s</option>
              <option value={60} className="bg-card text-foreground">1m</option>
              <option value={0} className="bg-card text-foreground">Paused</option>
            </select>
          </div>

          {/* Modern Theme Switcher */}
          <ThemeToggle />

          {/* Grafana Deep Link  (14px, 32px height, 500 weight) */}
          <a
            href="http://localhost:3001/d/Main-Dashboard"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open Grafana Dashboards in new tab"
            className="hidden md:flex items-center gap-1.5 h-8 px-3 py-1 text-xs font-medium rounded-[6px] bg-secondary hover:bg-muted border border-border text-foreground hover:text-white transition-colors shadow-[rgba(61,68,77,0.7)_0px_-1px_0px_0px_inset]"
          >
            <BarChart3 className="h-3.5 w-3.5 text-[#d29922]" aria-hidden="true" />
            <span>Grafana</span>
            <ExternalLink className="h-3 w-3 opacity-60 ml-0.5" aria-hidden="true" />
          </a>
        </div>
      </div>

      {/* GitHub UnderlineNav: seamlessly connected without grey separating border */}
      <nav
        className="flex items-center px-4 sm:px-6 pt-1 pb-2 overflow-x-auto bg-card dark:bg-[#121212] scrollbar-none"
        aria-label="Repository navigation"
      >
        <div className="flex items-center gap-1">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = location.pathname === tab.href;

            return (
              <NavLink
                key={tab.href}
                to={tab.href}
                className={({ isActive }) => `
                  relative flex items-center gap-2 px-3.5 py-2.5 text-sm leading-[21px] transition-colors whitespace-nowrap
                  ${isActive ? 'text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground font-medium'}
                `}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-foreground' : 'text-muted-foreground'}`} aria-hidden="true" />
                <span>{tab.name}</span>
                {tab.count !== undefined && (
                  <span className={`
                    inline-flex items-center justify-center min-w-[20px] h-[20px] px-1.5 text-xs font-medium rounded-full tabular-nums leading-none
                    ${tab.isAlert
                      ? 'bg-[#e5484d]/20 text-[#e5484d] border border-[#e5484d]/40 shadow-[0_0_8px_rgba(229,72,77,0.3)]'
                      : isActive
                        ? 'bg-border text-foreground'
                        : 'bg-secondary text-muted-foreground'}
                  `}>
                    {tab.count}
                  </span>
                )}
                {/* Odysseus Crimson Navigation Underline */}
                {isActive && (
                  <span className="absolute bottom-0 left-3.5 right-3.5 h-[2px] bg-[#e5484d] rounded-full shadow-[0_0_8px_rgba(229,72,77,0.6)]" />
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
