import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SmsStatusBadgeProps {
  status: string;
  className?: string;
}

export function SmsStatusBadge({ status, className }: SmsStatusBadgeProps) {
  const statusConfig = {
    sent: {
      icon: CheckCircle,
      label: 'Sent',
      className: 'bg-success/15 text-success',
    },
    pending: {
      icon: Clock,
      label: 'Pending',
      className: 'bg-warning/15 text-warning',
    },
    failed: {
      icon: XCircle,
      label: 'Failed',
      className: 'bg-destructive/15 text-destructive',
    },
    unknown: {
      icon: AlertCircle,
      label: 'Unknown',
      className: 'bg-muted text-muted-foreground',
    },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.unknown;
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        config.className,
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}
