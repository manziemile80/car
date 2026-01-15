import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Shield, GraduationCap, Bell, BarChart3, CheckCircle, Loader2 } from 'lucide-react';

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
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="hero-gradient">
        <nav className="container mx-auto flex items-center justify-between py-6 px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-foreground/20">
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-primary-foreground">Conduct</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10">
                Sign In
              </Button>
            </Link>
            <Link to="/signup">
              <Button className="bg-primary-foreground text-primary hover:bg-primary-foreground/90">
                Get Started
              </Button>
            </Link>
          </div>
        </nav>

        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-5xl font-bold tracking-tight text-primary-foreground md:text-6xl">
            Student Behavior
            <br />
            Management Made Easy
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-primary-foreground/80">
            Empower teachers to track student behavior, engage parents with instant notifications,
            and foster a positive learning environment with our comprehensive system.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link to="/signup">
              <Button size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90">
                Start Free Trial
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-foreground">Everything You Need</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            A complete solution for managing student behavior and engaging parents
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <GraduationCap className="h-7 w-7" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-foreground">Behavior Tracking</h3>
            <p className="mt-2 text-muted-foreground">
              Track discipline, respect, attendance, and participation scores for each student
            </p>
          </div>

          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
              <Bell className="h-7 w-7" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-foreground">SMS Notifications</h3>
            <p className="mt-2 text-muted-foreground">
              Automatically notify parents via SMS when behavior scores are recorded
            </p>
          </div>

          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <BarChart3 className="h-7 w-7" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-foreground">Reports & Analytics</h3>
            <p className="mt-2 text-muted-foreground">
              Generate comprehensive reports and visualize behavior trends over time
            </p>
          </div>

          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-success/10 text-success">
              <CheckCircle className="h-7 w-7" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-foreground">Role-Based Access</h3>
            <p className="mt-2 text-muted-foreground">
              Secure access for administrators, teachers, and parents with different permissions
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-muted py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-foreground">Ready to Get Started?</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Join hundreds of schools already using Conduct to manage student behavior
          </p>
          <Link to="/signup" className="mt-8 inline-block">
            <Button size="lg">Create Your Account</Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2026 Conduct. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
