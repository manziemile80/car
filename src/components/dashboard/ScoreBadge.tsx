import { cn } from '@/lib/utils';

interface ScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
}

export function ScoreBadge({ score, size = 'md' }: ScoreBadgeProps) {
  const getScoreClass = (score: number) => {
    if (score < 0) return 'bg-destructive/15 text-destructive border-destructive/30';
    if (score === 0) return 'bg-muted text-muted-foreground border-border';
    if (score >= 80) return 'bg-success/15 text-success border-success/30';
    if (score >= 40) return 'bg-secondary/15 text-secondary border-secondary/30';
    return 'bg-warning/15 text-warning border-warning/30';
  };

  const getScoreLabel = (score: number) => {
    if (score < 0) return 'Deducted';
    if (score === 0) return 'No change';
    if (score >= 80) return 'Excellent';
    if (score >= 40) return 'Good';
    return 'Added';
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium',
        getScoreClass(score),
        sizeClasses[size]
      )}
    >
      <span className="font-bold">{score > 0 ? `+${score}` : score}</span>
      <span className="opacity-80">• {getScoreLabel(score)}</span>
    </span>
  );
}
