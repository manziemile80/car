import { SidebarNav } from './SidebarNav';

export function Sidebar() {
  return (
    <aside className="hidden lg:flex fixed inset-y-0 left-0 z-40 w-64 flex-col bg-sidebar">
      <SidebarNav />
    </aside>
  );
}
