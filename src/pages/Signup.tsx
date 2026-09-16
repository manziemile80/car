import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import schoolLogo from '@/assets/college-rebero-logo.png';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Signup() {
  const { user, loading: authLoading, signUp } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [accountType, setAccountType] = useState<'student' | 'parent' | 'viewer'>('student');
  const [loading, setLoading] = useState(false);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    const { error } = await signUp(email, password, fullName, accountType);

    if (error) {
      toast.error('Signup failed', { description: error.message });
    } else {
      toast.success('Account created!', {
        description:
          accountType === 'student'
            ? 'Check your email to confirm, then sign in to take quizzes and assignments.'
            : 'Check your email to confirm, then sign in.',
      });
    }

    setLoading(false);
  };

  return (
    <div className="flex min-h-screen">
      {/* Left side - Form */}
      <div className="flex flex-1 flex-col justify-center px-8 py-12 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <img src={schoolLogo} alt="College De Rebero" className="h-14 w-14 object-contain" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">College De Rebero</h1>
              <p className="text-sm text-muted-foreground">Behavior Management System</p>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-foreground">Create an account</h2>
              <p className="mt-2 text-muted-foreground">
                Get started with College De Rebero today
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Eric Kamana"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountType">I am a</Label>
                <Select value={accountType} onValueChange={(v) => setAccountType(v as typeof accountType)}>
                  <SelectTrigger id="accountType" className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="parent">Parent</SelectItem>
                    <SelectItem value="viewer">Staff / other (view only)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Students get access to quizzes and assignments after signing in.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@school.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="h-11"
                />
              </div>

              <Button type="submit" className="w-full h-11" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Hero */}
      <div className="hidden lg:flex lg:flex-1 hero-gradient items-center justify-center p-12">
        <div className="max-w-lg text-center text-primary-foreground">
          <h2 className="text-4xl font-bold tracking-tight">
            Join the Future of Student Management
          </h2>
          <p className="mt-6 text-lg opacity-90">
            Create an account and work with your school administrator to get set up with the appropriate access level.
          </p>
          <div className="mt-10 space-y-4 text-left">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-foreground/20">
                ✓
              </div>
              <p>Real-time behavior tracking</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-foreground/20">
                ✓
              </div>
              <p>Instant parent notifications</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-foreground/20">
                ✓
              </div>
              <p>Comprehensive reports</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
