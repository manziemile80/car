import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning';
  trend?: {
    value: number;
    label: string;
  };
}

export function StatCard({ title, value, subtitle, icon: Icon, variant = 'default', trend }: StatCardProps) {
  const variants = {
    default: 'bg-card border border-border',
    primary: 'bg-primary text-primary-foreground border-none',
    secondary: 'bg-secondary text-secondary-foreground border-none',
    success: 'bg-success text-success-foreground border-none',
    warning: 'bg-warning text-warning-foreground border-none',
  };

  const iconVariants = {
    default: 'bg-muted text-muted-foreground',
    primary: 'bg-primary-foreground/20 text-primary-foreground',
    secondary: 'bg-secondary-foreground/20 text-secondary-foreground',
    success: 'bg-success-foreground/20 text-success-foreground',
    warning: 'bg-warning-foreground/20 text-warning-foreground',
  };

  const textVariants = {
    default: 'text-muted-foreground',
    primary: 'text-primary-foreground/80',
    secondary: 'text-secondary-foreground/80',
    success: 'text-success-foreground/80',
    warning: 'text-warning-foreground/80',
  };

  return (
    <div className={cn('rounded-xl p-6 shadow-sm', variants[variant])}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className={cn('text-sm font-medium', textVariants[variant])}>{title}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
          {subtitle && (
            <p className={cn('mt-1 text-sm', textVariants[variant])}>{subtitle}</p>
          )}
          {trend && (
            <div className="mt-2 flex items-center gap-1">
              <span
                className={cn(
                  'text-sm font-medium',
                  trend.value >= 0 ? 'text-success' : 'text-destructive'
                )}
              >
                {trend.value >= 0 ? '+' : ''}
                {trend.value}%
              </span>
              <span className={cn('text-sm', textVariants[variant])}>{trend.label}</span>
            </div>
          )}
        </div>
        <div className={cn('flex h-12 w-12 items-center justify-center rounded-lg', iconVariants[variant])}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
