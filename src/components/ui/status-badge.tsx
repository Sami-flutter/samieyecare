import { cn } from '@/lib/utils';
import { VisitStatus } from '@/types/clinic';

interface StatusBadgeProps {
  status: VisitStatus;
  className?: string;
}

const statusConfig: Record<VisitStatus, { label: string; className: string }> = {
  waiting: {
    label: 'Waiting',
    className: 'bg-warning/15 text-warning-foreground border-warning/30',
  },
  eye_measurement: {
    label: 'Eye Measurement',
    className: 'bg-info/15 text-info border-info/30',
  },
  with_doctor: {
    label: 'With Doctor',
    className: 'bg-primary/15 text-primary border-primary/30',
  },
  pharmacy: {
    label: 'Pharmacy',
    className: 'bg-accent/15 text-accent-foreground border-accent/30',
  },
  completed: {
    label: 'Completed',
    className: 'bg-success/15 text-success border-success/30',
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border',
        config.className,
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 animate-pulse-soft" />
      {config.label}
    </span>
  );
}
