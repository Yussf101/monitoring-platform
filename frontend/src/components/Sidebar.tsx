import { NavLink } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Server, 
  AlertTriangle, 
  Radio, 
  ExternalLink,
  FileCode2,
  Cpu,
  BarChart3,
  X
} from 'lucide-react';
import { cn } from '../lib/utils';
import { PulseLogo } from './PulseLogo';
import { ThemeToggle } from './ThemeToggle';

interface SidebarProps {
  targetCount?: number;
  firingCount?: number;
  isOpen?: boolean;
  onClose?: () => void;
}

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Targets', href: '/targets', icon: Server, badgeKey: 'targets' },
  { name: 'Alerts', href: '/alerts', icon: AlertTriangle, badgeKey: 'alerts' },
  { name: 'Discovery', href: '/discovery', icon: Radio },
];

const externalLinks = [
  { name: 'Grafana Metrics', href: 'http://localhost:3001/d/Main-Dashboard', icon: BarChart3 },
  { name: 'Prometheus SD', href: 'http://localhost:9090', icon: Cpu },
  { name: 'API Docs', href: 'http://localhost:8000/docs', icon: FileCode2 },
];

export function Sidebar({ 
  targetCount = 0, 
  firingCount = 0,
  isOpen,
  onClose
}: SidebarProps) {
  // If isOpen is explicitly false, AnimatePresence handles exiting
  const isVisible = isOpen === undefined || isOpen === true;

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop for overlay drawer */}
          {isOpen === true && (
            <motion.div 
              key="sidebar-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onClose}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs"
              aria-hidden="true"
            />
          )}

          <motion.aside 
            key="sidebar-drawer"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className={cn(
              "bg-[#0d1117] border-r border-[#30363d] flex flex-col justify-between select-none z-50 text-[#e6edf3]",
              isOpen ? "fixed left-0 top-0 h-dvh w-72 shadow-[0_8px_24px_rgba(1,4,9,0.8)]" : "fixed left-0 top-0 h-dvh w-64"
            )}
            aria-label="Platform Sidebar Navigation"
          >
            <div>
              {/* Top bar with embedded red PulseLogo (not contoured) */}
              <div className="flex h-14 items-center justify-between px-4 border-b border-[#21262d]">
                <div className="flex items-center gap-2.5">
                  <PulseLogo className="h-8 w-8 text-[#f78166] shrink-0" />
                  <span className="text-[17px] font-semibold text-[#f0f6fc] tracking-tight">
                    Monitoring Platform
                  </span>
                </div>
                {onClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close navigation drawer"
                    className="flex h-7 w-7 items-center justify-center rounded-[6px] text-[#7d8590] hover:text-white hover:bg-[#21262d] transition-colors"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
              </div>

          {/* Navigation Section */}
          <div className="p-3">
            <div className="px-2 pb-2 text-xs font-semibold uppercase tracking-wider text-[#7d8590]">
              Navigation
            </div>
            <nav className="space-y-0.5" aria-label="Main Navigation">
              {navItems.map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      "group flex items-center justify-between rounded-[6px] px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-[#21262d] text-[#f0f6fc] font-semibold shadow-[rgba(61,68,77,0.7)_0px_-1px_0px_0px_inset]"
                        : "text-[#7d8590] hover:bg-[#161b22] hover:text-[#f0f6fc]"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-2.5">
                        <item.icon 
                          className={cn("h-4 w-4 shrink-0 transition-colors", isActive ? "text-[#f0f6fc]" : "text-[#7d8590] group-hover:text-[#f0f6fc]")} 
                          aria-hidden="true" 
                        />
                        <span>{item.name}</span>
                      </div>

                      {item.badgeKey === 'targets' && targetCount > 0 && (
                        <span className="rounded-full bg-[#30363d] px-2 py-0.5 text-xs font-mono tabular-nums text-[#f0f6fc]">
                          {targetCount}
                        </span>
                      )}

                      {item.badgeKey === 'alerts' && firingCount > 0 && (
                        <span className="rounded-full bg-[#f85149]/20 px-2 py-0.5 text-xs font-mono tabular-nums font-semibold text-[#f85149] border border-[#f85149]/40">
                          {firingCount}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* External Links Section */}
          <div className="px-3 py-2 border-t border-[#21262d]">
            <div className="px-2 pb-2 text-xs font-semibold uppercase tracking-wider text-[#7d8590]">
              External Services
            </div>
            <div className="space-y-0.5">
              {externalLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between rounded-[6px] px-3 py-2 text-sm text-[#7d8590] hover:bg-[#161b22] hover:text-[#f0f6fc] transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <link.icon className="h-4 w-4 text-[#7d8590] group-hover:text-[#4493f8] transition-colors" aria-hidden="true" />
                    <span>{link.name}</span>
                  </div>
                  <ExternalLink className="h-3.5 w-3.5 opacity-40 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Status Footer */}
        <div className="p-3 border-t border-[#30363d] bg-[#161b22]">
          <div className="rounded-[6px] border border-[#30363d] bg-[#0d1117] p-2.5 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[10px] uppercase text-[#848d97] font-semibold">Scrape Pipeline</span>
              <span className="flex items-center gap-1.5 text-[10px] text-[#3fb950] font-medium">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#3fb950]" />
                Active
              </span>
            </div>

            <div className="flex items-center justify-between text-[10px] text-[#848d97] pt-1.5 border-t border-[#21262d]">
              <span className="uppercase text-[9px]">HTTP SD Poller</span>
              <span className="text-[#e6edf3] font-mono">:8000</span>
            </div>
          </div>

          <div className="pt-2">
            <ThemeToggle compact className="w-full" />
          </div>
        </div>
      </motion.aside>
    </>
  )}
</AnimatePresence>
  );
}
