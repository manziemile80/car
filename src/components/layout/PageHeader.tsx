import { ReactNode } from 'react';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <div className="space-y-3">
      {eyebrow && (
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-secondary">{eyebrow}</p>
      )}
      <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{title}</h1>
      {description && <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>}
      {actions && <div className="flex flex-wrap items-center gap-2 pt-1">{actions}</div>}
    </div>
  );
}
