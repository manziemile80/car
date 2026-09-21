import {
  LayoutDashboard,
  Users,
  GraduationCap,
  UserCheck,
  ClipboardList,
  BarChart3,
  Settings,
  BookOpen,
  FileText,
  CalendarCheck,
  Pencil,
  Library,
  FolderOpen,
  NotebookPen,
  ListChecks,
  Package,
} from 'lucide-react';
import { AppRole } from '@/types/database';

export interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: AppRole[];
  group: 'Overview' | 'School' | 'E-Learning' | 'Records' | 'Operations' | 'Admin';
}

export const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['admin', 'director_of_studies', 'director_of_discipline', 'stock_manager'],
    group: 'Overview',
  },

  {
    label: 'Students',
    href: '/students',
    icon: GraduationCap,
    roles: ['admin', 'teacher', 'viewer', 'director_of_studies', 'director_of_discipline'],
    group: 'School',
  },
  {
    label: 'Classes',
    href: '/classes',
    icon: BookOpen,
    roles: ['admin', 'teacher', 'viewer', 'director_of_studies', 'director_of_discipline'],
    group: 'School',
  },
  {
    label: 'Subjects',
    href: '/subjects',
    icon: Library,
    roles: ['admin', 'teacher', 'viewer', 'director_of_studies'],
    group: 'School',
  },
  { label: 'Parents', href: '/parents', icon: UserCheck, roles: ['admin'], group: 'School' },

  {
    label: 'Courses',
    href: '/courses',
    icon: NotebookPen,
    roles: ['admin', 'teacher', 'parent', 'student', 'director_of_studies'],
    group: 'E-Learning',
  },
  {
    label: 'Materials',
    href: '/materials',
    icon: FolderOpen,
    roles: ['admin', 'teacher', 'parent', 'student', 'director_of_studies'],
    group: 'E-Learning',
  },
  {
    label: 'Assignments',
    href: '/assignments',
    icon: ClipboardList,
    roles: ['admin', 'teacher', 'parent', 'student', 'director_of_studies'],
    group: 'E-Learning',
  },
  {
    label: 'Quizzes',
    href: '/quizzes',
    icon: ListChecks,
    roles: ['admin', 'teacher', 'parent', 'student', 'director_of_studies'],
    group: 'E-Learning',
  },

  {
    label: 'Behavior Scores',
    href: '/scores',
    icon: ClipboardList,
    roles: ['admin', 'teacher', 'parent', 'student', 'director_of_discipline'],
    group: 'Records',
  },
  {
    label: 'Marks Entry',
    href: '/marks',
    icon: Pencil,
    roles: ['admin', 'teacher', 'director_of_studies'],
    group: 'Records',
  },
  {
    label: 'Attendance',
    href: '/attendance',
    icon: CalendarCheck,
    roles: ['admin', 'teacher', 'parent', 'student', 'director_of_studies', 'director_of_discipline'],
    group: 'Records',
  },
  {
    label: 'Academic Reports',
    href: '/academic-reports',
    icon: FileText,
    roles: ['admin', 'teacher', 'parent', 'student', 'director_of_studies', 'director_of_discipline'],
    group: 'Records',
  },
  {
    label: 'Reports',
    href: '/reports',
    icon: BarChart3,
    roles: ['admin', 'teacher', 'parent', 'viewer', 'director_of_studies', 'director_of_discipline'],
    group: 'Records',
  },

  {
    label: 'Stock Management',
    href: '/stock',
    icon: Package,
    roles: ['admin', 'stock_manager'],
    group: 'Operations',
  },

  { label: 'Users', href: '/users', icon: Users, roles: ['admin'], group: 'Admin' },
  { label: 'Settings', href: '/settings', icon: Settings, roles: ['admin'], group: 'Admin' },
];

export const roleBadges: Record<AppRole, { label: string; className: string }> = {
  admin: { label: 'Administrator', className: 'bg-accent/20 text-accent' },
  teacher: { label: 'Teacher', className: 'bg-secondary/20 text-secondary' },
  parent: { label: 'Parent', className: 'bg-primary/20 text-primary' },
  student: { label: 'Student', className: 'bg-info/20 text-info' },
  stock_manager: { label: 'Stock Manager', className: 'bg-warning/20 text-warning' },
  viewer: { label: 'Viewer (read-only)', className: 'bg-muted text-muted-foreground' },
  director_of_studies: { label: 'Director of Studies', className: 'bg-indigo-500/15 text-indigo-400' },
  director_of_discipline: { label: 'Director of Discipline', className: 'bg-rose-500/15 text-rose-400' },
};
