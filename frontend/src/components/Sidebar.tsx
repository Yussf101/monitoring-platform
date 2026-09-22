import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Server, AlertTriangle, Activity } from 'lucide-react';
import { cn } from '../lib/utils';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Targets', href: '/targets', icon: Server },
  { name: 'Alerts', href: '/alerts', icon: AlertTriangle },
];

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-card">
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center px-6 border-b border-border/50">
          <Activity className="h-6 w-6 text-primary mr-2" />
          <span className="text-lg font-bold text-primary">Monitoring</span>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-none px-3 py-2 text-sm font-medium transition-colors hover:bg-muted/50 hover:text-foreground",
                  isActive
                    ? "bg-muted/20 text-primary border-l-2 border-primary"
                    : "text-muted-foreground border-l-2 border-transparent"
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </NavLink>
          ))}
          
          <a
            href="http://localhost:3001/d/Main-Dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-3 rounded-none px-3 py-2 text-sm font-medium transition-colors text-muted-foreground border-l-2 border-transparent hover:bg-muted/50 hover:text-foreground mt-4"
          >
            <div className="flex items-center gap-3">
              <Activity className="h-4 w-4" />
              Grafana
            </div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-3 w-3 opacity-50"
            >
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        </nav>

        <div className="p-4 border-t border-border/50">
          <div className="flex items-center gap-3 px-3 py-2 text-xs text-muted-foreground">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
            </span>
            System Online
          </div>
        </div>
      </div>
    </aside>
  );
}
