import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import { LogOut, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import schoolLogo from '@/assets/college-rebero-logo.png';
import { navItems, roleBadges, NavItem } from './navItems';

export function SidebarNav() {
  const { role, profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const visible = navItems.filter((item) => role && item.roles.includes(role));
  const groups = visible.reduce<Record<string, NavItem[]>>((acc, item) => {
    acc[item.group] = [...(acc[item.group] || []), item];
    return acc;
  }, {});

  const badge = role ? roleBadges[role] : null;

  return (
    <>
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-5">
        <img src={schoolLogo} alt="College De Rebero" width={34} height={34} className="h-8 w-8 object-contain" />
        <div className="min-w-0">
          <p className="truncate text-sm font-bold leading-tight text-sidebar-foreground">College De Rebero</p>
          <p className="truncate text-[11px] leading-tight text-sidebar-foreground/60">School &amp; E-learning</p>
        </div>
      </div>

      <div className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sidebar-accent text-sm font-semibold text-sidebar-foreground">
            {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium text-sidebar-foreground">{profile?.full_name || 'User'}</p>
            {badge && (
              <span className={cn('inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium', badge.className)}>
                {badge.label}
              </span>
            )}
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto p-3">
        {Object.entries(groups).map(([group, items]) => (
          <div key={group} className="space-y-1">
            <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/50">
              {group}
            </p>
            {items.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-foreground'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                  )}
                >
                  <item.icon className="h-4.5 w-4.5 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <Button
          variant="ghost"
          onClick={toggleTheme}
          className="mb-1 w-full justify-start gap-3 rounded-xl text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </Button>
        <Button
          variant="ghost"
          onClick={signOut}
          className="w-full justify-start gap-3 rounded-xl text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
        >
          <LogOut className="h-4.5 w-4.5" />
          Sign Out
        </Button>
      </div>
    </>
  );
}
