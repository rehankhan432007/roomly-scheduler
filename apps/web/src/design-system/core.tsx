import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ---- Buttons ----
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, leftIcon, rightIcon, fullWidth, children, disabled, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center font-medium rounded-control transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
    const variants = {
      primary: 'bg-primary text-white hover:bg-primary-700',
      secondary: 'bg-white border border-line text-ink hover:bg-canvas',
      ghost: 'bg-transparent text-primary hover:bg-primary-50',
      danger: 'bg-danger text-white hover:bg-danger/90',
    };
    const sizes = {
      sm: 'h-8 px-3 text-small',
      md: 'h-10 px-4 text-body',
      lg: 'h-12 px-6 text-body',
    };
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(base, variants[variant], sizes[size], fullWidth && 'w-full', className)}
        {...props}
      >
        {loading && <Spinner size="sm" className="mr-2" />}
        {!loading && leftIcon && <span className="mr-2">{leftIcon}</span>}
        {children}
        {!loading && rightIcon && <span className="ml-2">{rightIcon}</span>}
      </button>
    );
  }
);
Button.displayName = 'Button';

export interface IconButtonProps extends Omit<ButtonProps, 'leftIcon' | 'rightIcon' | 'fullWidth'> {
  icon: React.ReactNode;
  label: string;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, label, size = 'md', className, ...props }, ref) => {
    const sizes = { sm: 'h-8 w-8', md: 'h-10 w-10', lg: 'h-12 w-12' };
    return (
      <Button ref={ref} size={size} className={cn('p-0', sizes[size], className)} aria-label={label} {...props}>
        {icon}
      </Button>
    );
  }
);
IconButton.displayName = 'IconButton';

// ---- Spinners ----
export function Spinner({ size = 'md', className }: { size?: 'sm' | 'md' | 'lg', className?: string }) {
  const sizes = { sm: 'h-4 w-4 border-2', md: 'h-6 w-6 border-2', lg: 'h-8 w-8 border-3' };
  return (
    <div className={cn("animate-spin rounded-full border-line border-t-primary", sizes[size], className)} />
  );
}

// ---- Layout / Cards ----
export function Card({ title, description, actions, padding = 'md', children, className }: {
  title?: string; description?: string; actions?: React.ReactNode; padding?: 'md' | 'none';
  children: React.ReactNode; className?: string;
}) {
  return (
    <div className={cn('bg-surface rounded-card shadow-card border border-line/60', className)}>
      {(title || actions) && (
        <div className="flex items-center justify-between p-5 border-b border-line/60">
          <div>
            {title && <h3 className="text-h3 font-semibold text-ink">{title}</h3>}
            {description && <p className="text-small text-muted mt-1">{description}</p>}
          </div>
          {actions && <div>{actions}</div>}
        </div>
      )}
      <div className={cn(padding === 'md' && 'p-5')}>{children}</div>
    </div>
  );
}

export function Divider({ className }: { className?: string }) {
  return <hr className={cn("border-t border-line/60 my-4", className)} />;
}

// ---- Badges ----
export function Badge({ tone = 'neutral', icon, children, className }: {
  tone?: 'neutral'|'primary'|'success'|'warning'|'danger'|'accent';
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  const tones = {
    neutral: 'bg-canvas text-ink',
    primary: 'bg-primary-50 text-primary-700',
    success: 'bg-success-50 text-success',
    warning: 'bg-warning-50 text-warning',
    danger: 'bg-danger-50 text-danger',
    accent: 'bg-accent-50 text-accent',
  };
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-pill text-caption font-medium', tones[tone], className)}>
      {icon && <span className="mr-1.5 -ml-0.5">{icon}</span>}
      {children}
    </span>
  );
}

export function StatusBadge({ kind, status, className }: {
  kind: 'booking' | 'room' | 'equipment' | 'issue';
  status: string;
  className?: string;
}) {
  const map: Record<string, { label: string, tone: 'neutral'|'primary'|'success'|'warning'|'danger'|'accent' }> = {
    // room
    ACTIVE: { label: 'Active', tone: 'success' },
    INACTIVE: { label: 'Inactive', tone: 'neutral' },
    MAINTENANCE: { label: 'Maintenance', tone: 'warning' },
    // equipment
    WORKING: { label: 'Working', tone: 'success' },
    FAULTY: { label: 'Faulty', tone: 'danger' },
    // issue
    OPEN: { label: 'Open', tone: 'danger' },
    ACKNOWLEDGED: { label: 'Acknowledged', tone: 'warning' },
    RESOLVED: { label: 'Resolved', tone: 'success' },
    // booking
    HELD: { label: 'Held', tone: 'warning' },
    CONFIRMED: { label: 'Confirmed', tone: 'primary' },
    CHECKED_IN: { label: 'Checked in', tone: 'success' },
    COMPLETED: { label: 'Completed', tone: 'neutral' },
    CANCELLED: { label: 'Cancelled', tone: 'danger' },
    NO_SHOW: { label: 'No show', tone: 'danger' },
    RELEASED: { label: 'Released', tone: 'warning' },
  };
  
  const mapped = map[status] || { label: status, tone: 'neutral' };
  return <Badge tone={mapped.tone} className={className}>{mapped.label}</Badge>;
}

// ---- Empty/Error/Loading States ----
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("bg-line/60 animate-pulse rounded-control", className)} />;
}

export function EmptyState({ icon, title, description, action }: {
  icon: React.ReactNode; title: string; description?: string; action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="text-muted mb-4">{icon}</div>
      <h3 className="text-h3 font-semibold text-ink mb-2">{title}</h3>
      {description && <p className="text-body text-muted mb-6 max-w-md">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-danger-50 rounded-card">
      <p className="text-danger font-medium mb-4">{message || 'Something went wrong.'}</p>
      {onRetry && <Button variant="secondary" onClick={onRetry}>Try Again</Button>}
    </div>
  );
}
