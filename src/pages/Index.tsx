import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  GraduationCap,
  Bell,
  BarChart3,
  CheckCircle,
  Loader2,
  LayoutDashboard,
  ClipboardList,
  CalendarCheck,
  FileText,
  Users,
  LogIn,
  ShieldCheck,
  Circle,
} from 'lucide-react';
import landingStudents from '@/assets/landing-students.jpg';
import schoolLogo from '@/assets/college-rebero-logo.png';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Students', icon: GraduationCap },
  { label: 'Behavior Scores', icon: ClipboardList },
  { label: 'Attendance', icon: CalendarCheck },
  { label: 'Academic Reports', icon: FileText },
  { label: 'Reports', icon: BarChart3 },
  { label: 'Users', icon: Users },
];

const modules = [
  {
    icon: ClipboardList,
    title: 'Behavior Scores',
    desc: 'Deduct conduct marks per category, every student starts each term at 40/40.',
    tone: 'text-primary bg-primary/10',
  },
  {
    icon: Bell,
    title: 'Parent SMS',
    desc: 'Bilingual alerts (EN/RW) sent automatically with deducted and remaining marks.',
    tone: 'text-secondary bg-secondary/10',
  },
  {
    icon: FileText,
    title: 'Academic Reports',
    desc: 'Per-term CAT/Exam marks, class position and printable PDF report cards.',
    tone: 'text-accent bg-accent/10',
  },
  {
    icon: ShieldCheck,
    title: 'Role-Based Access',
    desc: 'Admin, teacher, parent and read-only viewer permissions enforced end to end.',
    tone: 'text-success bg-success/10',
  },
];

export default function Index() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* App top bar */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
        <div className="flex h-14 items-center justify-between gap-3 px-3 sm:px-5">
          <div className="flex items-center gap-2.5 min-w-0">
            <img src={schoolLogo} alt="College De Rebero logo" width={32} height={32} className="h-8 w-8 object-contain" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold leading-tight text-foreground">College De Rebero</p>
              <p className="truncate text-[11px] leading-tight text-muted-foreground">Behavior Management System</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground sm:inline-flex">
              <Circle className="h-2 w-2 fill-success text-success" /> System online
            </span>
            <Link to="/login">
              <Button variant="outline" size="sm" className="gap-1.5">
                <LogIn className="h-4 w-4" /> Sign In
              </Button>
            </Link>
            <Link to="/signup">
              <Button size="sm">Create Account</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Static nav preview (system shell) */}
        <aside className="hidden w-56 shrink-0 flex-col border-r border-sidebar-border bg-sidebar p-3 lg:flex">
          <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/60">
            Modules
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/70"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </div>
            ))}
          </nav>
          <div className="mt-auto rounded-lg bg-sidebar-accent/60 p-3 text-xs text-sidebar-foreground/80">
            Sign in to unlock the modules for your role.
          </div>
        </aside>

        {/* Main workspace */}
        <main className="flex-1 min-w-0 p-3 sm:p-5 space-y-4">
          {/* Console banner */}
          <section className="relative overflow-hidden rounded-xl border border-border">
            <img
              src={landingStudents}
              alt="Students at College De Rebero"
              className="absolute inset-0 h-full w-full object-cover animate-hero-bg-1"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-primary/85 via-primary/60 to-primary/30" />
            <div className="relative z-10 p-5 sm:p-8">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-primary-foreground/80">
                Conduct · Console
              </p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-primary-foreground sm:text-3xl">
                Student Behavior &amp; Academic Records
              </h1>
              <p className="mt-2 max-w-xl text-sm text-primary-foreground/90">
                Record conduct deductions, take attendance, enter subject marks and generate ranked
                report cards — all in one internal system.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link to="/login">
                  <Button size="sm" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90">
                    Open the system
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button size="sm" variant="outline" className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/15">
                    Request access
                  </Button>
                </Link>
              </div>
            </div>
          </section>

          {/* Status tiles */}
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { label: 'Conduct baseline', value: '40/40', hint: 'Per student, per term' },
              { label: 'Marks split', value: '40 + 60', hint: 'CAT + Exam' },
              { label: 'Parent alerts', value: 'EN / RW', hint: 'Bilingual SMS' },
              { label: 'Report cards', value: 'PDF', hint: 'Ranked by position' },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-border bg-card p-3.5">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{s.label}</p>
                <p className="mt-1 text-xl font-semibold text-foreground">{s.value}</p>
                <p className="text-[11px] text-muted-foreground">{s.hint}</p>
              </div>
            ))}
          </section>

          {/* Modules panel */}
          <section className="rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 className="text-sm font-semibold text-foreground">Available modules</h2>
              <span className="text-[11px] text-muted-foreground">Access depends on your role</span>
            </div>
            <div className="grid gap-3 p-4 sm:grid-cols-2">
              {modules.map((m) => (
                <div key={m.title} className="flex gap-3 rounded-lg border border-border/70 bg-background p-3.5">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${m.tone}`}>
                    <m.icon className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{m.title}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{m.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Access row */}
          <section className="flex flex-col items-start justify-between gap-3 rounded-xl border border-border bg-muted/50 p-4 sm:flex-row sm:items-center">
            <div className="flex items-start gap-2.5">
              <CheckCircle className="mt-0.5 h-5 w-5 text-success" />
              <div>
                <p className="text-sm font-medium text-foreground">Already registered?</p>
                <p className="text-xs text-muted-foreground">
                  New accounts start as read-only viewers until an administrator assigns a role.
                </p>
              </div>
            </div>
            <Link to="/login">
              <Button size="sm">Sign in</Button>
            </Link>
          </section>
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-card/60 px-4 py-4 text-center text-xs text-muted-foreground sm:text-left">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <span>Gicumbi, Ruvune, Rebero · +250 788 000 000 · info@collegederebero.rw</span>
          <span>© {new Date().getFullYear()} College De Rebero — Excellence · Discipline · Integrity</span>
        </div>
      </footer>
    </div>
  );
}
