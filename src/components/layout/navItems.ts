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
} from 'lucide-react';
import { AppRole } from '@/types/database';

export interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: AppRole[];
  group: 'Overview' | 'School' | 'E-learning' | 'Records' | 'Admin';
}

export const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['admin'], group: 'Overview' },

  { label: 'Students', href: '/students', icon: GraduationCap, roles: ['admin', 'teacher', 'viewer'], group: 'School' },
  { label: 'Classes', href: '/classes', icon: BookOpen, roles: ['admin', 'teacher', 'viewer'], group: 'School' },
  { label: 'Subjects', href: '/subjects', icon: Library, roles: ['admin', 'teacher', 'viewer'], group: 'School' },
  { label: 'Parents', href: '/parents', icon: UserCheck, roles: ['admin'], group: 'School' },

  { label: 'Courses', href: '/courses', icon: NotebookPen, roles: ['admin', 'teacher', 'parent', 'student'], group: 'E-learning' },
  { label: 'Materials', href: '/materials', icon: FolderOpen, roles: ['admin', 'teacher', 'parent', 'student'], group: 'E-learning' },
  { label: 'Assignments', href: '/assignments', icon: ClipboardList, roles: ['admin', 'teacher', 'parent', 'student'], group: 'E-learning' },
  { label: 'Quizzes', href: '/quizzes', icon: ListChecks, roles: ['admin', 'teacher', 'parent', 'student'], group: 'E-learning' },

  { label: 'Behavior Scores', href: '/scores', icon: ClipboardList, roles: ['admin', 'teacher', 'parent', 'student'], group: 'Records' },
  { label: 'Marks Entry', href: '/marks', icon: Pencil, roles: ['admin', 'teacher'], group: 'Records' },
  { label: 'Attendance', href: '/attendance', icon: CalendarCheck, roles: ['admin', 'teacher', 'parent', 'student'], group: 'Records' },
  { label: 'Academic Reports', href: '/academic-reports', icon: FileText, roles: ['admin', 'teacher', 'parent', 'student'], group: 'Records' },
  { label: 'Reports', href: '/reports', icon: BarChart3, roles: ['admin', 'teacher', 'parent', 'viewer'], group: 'Records' },

  { label: 'Users', href: '/users', icon: Users, roles: ['admin'], group: 'Admin' },
  { label: 'Settings', href: '/settings', icon: Settings, roles: ['admin'], group: 'Admin' },
];

export const roleBadges: Record<AppRole, { label: string; className: string }> = {
  admin: { label: 'Administrator', className: 'bg-accent/20 text-accent' },
  teacher: { label: 'Teacher', className: 'bg-secondary/20 text-secondary' },
  parent: { label: 'Parent', className: 'bg-primary/20 text-primary' },
  student: { label: 'Student', className: 'bg-info/20 text-info' },
  viewer: { label: 'Viewer (read-only)', className: 'bg-muted text-muted-foreground' },
};
