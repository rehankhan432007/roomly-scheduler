// Card, Badge, StatusBadge, StatCard, PageHeader, Logo and other UI components
'use client';

import { type ReactNode } from 'react';
import { cn } from './utils';
import { Star, AlertCircle, Loader2, AlertTriangle, Info } from 'lucide-react';

// ---- Card ----
export interface CardProps {
  title?: string;
  description?: string;
  actions?: ReactNode;
  padding?: 'md' | 'none';
  children: ReactNode;
  className?: string;
}

export function Card({ title, description, actions, padding = 'md', children, className }: CardProps) {
  return (
    <div className={cn('bg-surface rounded-card shadow-card border border-line/60', className)}>
      {(title || actions) && (
        <div className={cn('flex items-center justify-between', padding === 'md' ? 'px-5 pt-5 pb-0' : 'px-0 pt-0 pb-0')}>
          <div>
            {title && <h3 className="text-h3 font-semibold text-ink">{title}</h3>}
            {description && <p className="text-small text-muted mt-0.5">{description}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={cn(padding === 'md' ? 'p-5' : '')}>{children}</div>
    </div>
  );
}

// ---- Badge ----
export interface BadgeProps {
  tone?: 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'accent';
  icon?: ReactNode;
  children: ReactNode;
}

const badgeToneClasses = {
  neutral: 'bg-canvas text-muted',
  primary: 'bg-primary-50 text-primary-700',
  success: 'bg-success-50 text-success',
  warning: 'bg-warning-50 text-warning',
  danger: 'bg-danger-50 text-danger',
  accent: 'bg-accent-50 text-accent',
};

export function Badge({ tone = 'neutral', icon, children }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-pill text-small font-medium', badgeToneClasses[tone])}>
      {icon}
      {children}
    </span>
  );
}

// ---- StatusBadge ----
const statusMap: Record<string, Record<string, { tone: BadgeProps['tone']; label: string }>> = {
  booking: {
    HELD: { tone: 'warning', label: 'Held' },
    CONFIRMED: { tone: 'primary', label: 'Confirmed' },
    CHECKED_IN: { tone: 'success', label: 'Checked in' },
    COMPLETED: { tone: 'neutral', label: 'Completed' },
    CANCELLED: { tone: 'danger', label: 'Cancelled' },
    NO_SHOW: { tone: 'danger', label: 'No show' },
    RELEASED: { tone: 'warning', label: 'Released' },
  },
  room: {
    ACTIVE: { tone: 'success', label: 'Active' },
    INACTIVE: { tone: 'neutral', label: 'Inactive' },
    MAINTENANCE: { tone: 'warning', label: 'Maintenance' },
  },
  equipment: {
    WORKING: { tone: 'success', label: 'Working' },
    FAULTY: { tone: 'danger', label: 'Faulty' },
    MAINTENANCE: { tone: 'warning', label: 'Maintenance' },
  },
  issue: {
    OPEN: { tone: 'danger', label: 'Open' },
    ACKNOWLEDGED: { tone: 'warning', label: 'Acknowledged' },
    RESOLVED: { tone: 'success', label: 'Resolved' },
  },
};

export interface StatusBadgeProps {
  kind: 'booking' | 'room' | 'equipment' | 'issue';
  status: string;
}

export function StatusBadge({ kind, status }: StatusBadgeProps) {
  const map = statusMap[kind] ?? {};
  const entry = map[status] ?? { tone: 'neutral' as const, label: status };
  return <Badge tone={entry.tone}>{entry.label}</Badge>;
}

// ---- StatCard ----
export interface StatCardProps {
  label: string;
  value: string | number;
  delta?: string;
  icon?: ReactNode;
  tone?: BadgeProps['tone'];
}

export function StatCard({ label, value, delta, icon, tone }: StatCardProps) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-small text-muted">{label}</p>
          <p className="text-h1 font-bold text-ink mt-1">{value}</p>
          {delta && <p className="text-small text-muted mt-1">{delta}</p>}
        </div>
        {icon && <div className="text-muted">{icon}</div>}
      </div>
    </Card>
  );
}

// ---- PageHeader ----
export interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
}

export function PageHeader({ title, description, actions, breadcrumbs }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
      <div>
        {breadcrumbs && (
          <nav className="flex items-center gap-1 text-small text-muted mb-1">
            {breadcrumbs.map((b, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <span>/</span>}
                {b.href ? (
                  <a href={b.href} className="hover:text-primary transition-colors">{b.label}</a>
                ) : (
                  <span>{b.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        <h1 className="text-h1 font-bold text-ink">{title}</h1>
        {description && <p className="text-body text-muted mt-1">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-3 mt-3 sm:mt-0">{actions}</div>}
    </div>
  );
}

// ---- RatingScore ----
export interface RatingScoreProps {
  value: number | null;
  count?: number;
  size?: 'sm' | 'md' | 'lg';
}

export function RatingScore({ value, count, size = 'md' }: RatingScoreProps) {
  const textSize = size === 'sm' ? 'text-small' : size === 'lg' ? 'text-h2' : 'text-body';
  const color = value === null ? 'text-muted' : value >= 8 ? 'text-success' : value >= 6 ? 'text-primary' : 'text-warning';

  return (
    <span className={cn('inline-flex items-center gap-1', textSize, color)}>
      <Star className={cn(size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4')} />
      {value !== null ? (
        <>
          <span className="font-semibold">{value.toFixed(1)}</span>
          <span className="text-muted">/10</span>
        </>
      ) : (
        <span>New</span>
      )}
      {count !== undefined && <span className="text-muted text-small">({count})</span>}
    </span>
  );
}

// ---- MatchScore ----
export interface MatchScoreProps {
  score: number;
  reason?: string;
}

export function MatchScore({ score, reason }: MatchScoreProps) {
  const circumference = 2 * Math.PI * 20;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-14 h-14">
        <svg className="w-14 h-14 -rotate-90" viewBox="0 0 48 48">
          <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="3" className="text-line" />
          <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="3"
            className="text-accent" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-small font-bold text-accent">{score}</span>
      </div>
      <span className="text-caption text-muted">match</span>
      {reason && <p className="text-small text-muted text-center">{reason}</p>}
    </div>
  );
}

// ---- Skeleton ----
export interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn('bg-line/60 animate-pulse rounded-control', className)} />;
}

// ---- EmptyState ----
export interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-muted mb-4">{icon}</div>
      <h3 className="text-h3 font-semibold text-ink">{title}</h3>
      {description && <p className="text-body text-muted mt-1 max-w-md">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ---- ErrorState ----
export interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message = 'Something went wrong', onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <AlertTriangle className="w-12 h-12 text-danger mb-4" />
      <h3 className="text-h3 font-semibold text-ink">Error</h3>
      <p className="text-body text-muted mt-1">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-4 px-4 py-2 bg-primary text-white rounded-control text-small font-medium hover:bg-primary-700 transition-colors">
          Try again
        </button>
      )}
    </div>
  );
}

// ---- Spinner ----
export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
}

export function Spinner({ size = 'md' }: SpinnerProps) {
  const sizeClass = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-8 h-8' : 'w-6 h-6';
  return <Loader2 className={cn(sizeClass, 'animate-spin text-primary')} />;
}

// ---- Avatar ----
export interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Avatar({ name, size = 'md' }: AvatarProps) {
  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  const sizeClass = size === 'sm' ? 'w-8 h-8 text-caption' : size === 'lg' ? 'w-12 h-12 text-body' : 'w-10 h-10 text-small';

  return (
    <div className={cn('rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-semibold', sizeClass)}>
      {initials}
    </div>
  );
}

// ---- Divider ----
export function Divider() {
  return <hr className="border-line my-6" />;
}

// ---- Logo ----
export interface LogoProps {
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
}

export function Logo({ variant = 'dark', size = 'md' }: LogoProps) {
  const textColor = variant === 'light' ? 'text-white' : 'text-ink';
  const textSize = size === 'sm' ? 'text-body' : size === 'lg' ? 'text-h1' : 'text-h2';

  return (
    <div className={cn('flex items-center gap-2', textColor)}>
      <div className="relative">
        <div className={cn(
          'rounded-lg bg-primary flex items-center justify-center',
          size === 'sm' ? 'w-6 h-6' : size === 'lg' ? 'w-10 h-10' : 'w-8 h-8',
        )}>
          <div className={cn(
            'border-2 border-white rounded-sm',
            size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4',
          )} />
        </div>
      </div>
      <span className={cn(textSize, 'font-bold tracking-tight')}>
        Meet<span className="text-primary">Maze</span>
      </span>
    </div>
  );
}

// ---- Modal ----
export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

export function Modal({ open, onClose, title, description, footer, size = 'md', children }: ModalProps) {
  if (!open) return null;

  const sizeClass = size === 'sm' ? 'max-w-sm' : size === 'lg' ? 'max-w-2xl' : 'max-w-lg';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />
      <div className={cn('relative bg-surface rounded-card shadow-pop w-full p-6', sizeClass)} role="dialog" aria-modal="true">
        <h2 className="text-h2 font-semibold text-ink">{title}</h2>
        {description && <p className="text-body text-muted mt-1">{description}</p>}
        <div className="mt-4">{children}</div>
        {footer && <div className="mt-6 flex justify-end gap-3">{footer}</div>}
      </div>
    </div>
  );
}

// ---- Tabs ----
export interface TabsProps {
  tabs: { id: string; label: string; badge?: string | number }[];
  value: string;
  onChange: (id: string) => void;
}

export function Tabs({ tabs, value, onChange }: TabsProps) {
  return (
    <div className="flex border-b border-line">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'px-4 py-2 text-body font-medium transition-colors relative',
            value === tab.id
              ? 'text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary'
              : 'text-muted hover:text-ink',
          )}
        >
          {tab.label}
          {tab.badge !== undefined && (
            <span className="ml-1.5 px-1.5 py-0.5 bg-primary-50 text-primary text-caption rounded-pill font-medium">
              {tab.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
