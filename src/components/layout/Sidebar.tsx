import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  UserCheck,
  ClipboardList,
  BarChart3,
  Settings,
  LogOut,
  Shield,
  BookOpen,
  Menu,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: ('admin' | 'teacher' | 'parent' | 'viewer')[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'teacher', 'parent', 'viewer'] },
  { label: 'Students', href: '/students', icon: GraduationCap, roles: ['admin', 'teacher', 'viewer'] },
  { label: 'Classes', href: '/classes', icon: BookOpen, roles: ['admin', 'teacher', 'viewer'] },
  { label: 'Parents', href: '/parents', icon: UserCheck, roles: ['admin'] },
  { label: 'Behavior Scores', href: '/scores', icon: ClipboardList, roles: ['admin', 'teacher', 'viewer'] },
  { label: 'Reports', href: '/reports', icon: BarChart3, roles: ['admin', 'teacher', 'parent', 'viewer'] },
  { label: 'Users', href: '/users', icon: Users, roles: ['admin'] },
  { label: 'Settings', href: '/settings', icon: Settings, roles: ['admin'] },
];

export function Sidebar() {
  const { role, profile, signOut } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const filteredNavItems = navItems.filter(
    (item) => role && item.roles.includes(role)
  );

  const getRoleBadge = () => {
    const badges = {
      admin: { label: 'Administrator', className: 'bg-accent/20 text-accent' },
      teacher: { label: 'Teacher', className: 'bg-secondary/20 text-secondary' },
      parent: { label: 'Parent', className: 'bg-primary/20 text-primary-foreground' },
      viewer: { label: 'Viewer (read-only)', className: 'bg-muted text-muted-foreground' },
    };
    return role ? badges[role] : null;
  };

  const badge = getRoleBadge();

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
          <Shield className="h-5 w-5 text-sidebar-primary-foreground" />
        </div>
        <span className="text-lg font-bold text-sidebar-foreground">College De Rebero</span>
      </div>

      {/* User info */}
      <div className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-foreground font-medium">
            {profile?.full_name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium text-sidebar-foreground">
              {profile?.full_name || 'User'}
            </p>
            {badge && (
              <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium', badge.className)}>
                {badge.label}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {filteredNavItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="border-t border-sidebar-border p-4">
        <Button
          variant="ghost"
          onClick={signOut}
          className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </Button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex h-14 items-center justify-between border-b border-border bg-background px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
            <Shield className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-base font-bold text-foreground">College De Rebero</span>
        </div>
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0 bg-sidebar border-sidebar-border">
            <div className="flex h-full flex-col">
              <SidebarContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-50 w-64 flex-col bg-sidebar">
        <SidebarContent />
      </aside>
    </>
  );
}
