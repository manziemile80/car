import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Search, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { SidebarNav } from './SidebarNav';
import { navItems } from './navItems';
import { useAuth } from '@/contexts/AuthContext';

export function AppTopBar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { profile, role } = useAuth();
  const navigate = useNavigate();

  const visible = navItems.filter((item) => role && item.roles.includes(role));

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur">
      <div className="flex h-16 items-center gap-2 px-3 sm:px-5">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 border-sidebar-border bg-sidebar p-0">
            <div className="flex h-full flex-col" onClick={() => setMobileOpen(false)}>
              <SidebarNav />
            </div>
          </SheetContent>
        </Sheet>

        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="flex h-11 flex-1 items-center gap-3 rounded-full border border-border bg-background px-4 text-left text-sm text-muted-foreground transition-colors hover:border-primary/40"
        >
          <Search className="h-4 w-4" />
          <span className="flex-1 truncate">Search anything</span>
          <span className="hidden rounded-md border border-border px-1.5 py-0.5 text-[10px] sm:inline">⌘K</span>
        </button>

        <Button variant="outline" size="icon" className="relative rounded-full" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
        </Button>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-secondary bg-secondary/15 text-sm font-semibold text-secondary">
          {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
        </div>
      </div>

      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="overflow-hidden p-0">
          <Command>
            <CommandInput placeholder="Search modules..." />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup heading="Modules">
                {visible.map((item) => (
                  <CommandItem
                    key={item.href}
                    value={item.label}
                    onSelect={() => {
                      setSearchOpen(false);
                      navigate(item.href);
                    }}
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </header>
  );
}
