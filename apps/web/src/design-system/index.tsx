import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ---- Button ----
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export function Button({
  variant = 'primary', size = 'md', loading, className, children, disabled, ...props
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-brand-500/30 disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm',
    secondary: 'bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200',
    ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  };
  const sizes = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2.5 text-sm', lg: 'px-6 py-3 text-base' };

  return (
    <button className={cn(base, variants[variant], sizes[size], className)} disabled={disabled || loading} {...props}>
      {loading && <Spinner size={16} />}
      {children}
    </button>
  );
}

// ---- Card ----
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export function Card({ hover, className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden',
        hover && 'hover:shadow-md hover:border-slate-300 transition-all cursor-pointer',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// ---- Badge ----
interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
}

export function Badge({ variant = 'default', className, children, ...props }: BadgeProps) {
  const variants = {
    default: 'bg-slate-100 text-slate-700',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-amber-100 text-amber-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
  };

  return (
    <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-semibold', variants[variant], className)} {...props}>
      {children}
    </span>
  );
}

// ---- StatusBadge ----
const STATUS_MAP: Record<string, { variant: BadgeProps['variant']; label: string }> = {
  HELD: { variant: 'warning', label: 'Held' },
  CONFIRMED: { variant: 'info', label: 'Confirmed' },
  CHECKED_IN: { variant: 'success', label: 'Checked In' },
  COMPLETED: { variant: 'default', label: 'Completed' },
  CANCELLED: { variant: 'error', label: 'Cancelled' },
  NO_SHOW: { variant: 'error', label: 'No Show' },
  RELEASED: { variant: 'warning', label: 'Released' },
  ACTIVE: { variant: 'success', label: 'Active' },
  INACTIVE: { variant: 'default', label: 'Inactive' },
  MAINTENANCE: { variant: 'warning', label: 'Maintenance' },
  WORKING: { variant: 'success', label: 'Working' },
  FAULTY: { variant: 'error', label: 'Faulty' },
  OPEN: { variant: 'error', label: 'Open' },
  ACKNOWLEDGED: { variant: 'info', label: 'Acknowledged' },
  RESOLVED: { variant: 'success', label: 'Resolved' },
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const mapped = STATUS_MAP[status] ?? { variant: 'default' as const, label: status };
  return <Badge variant={mapped.variant} className={className}>{mapped.label}</Badge>;
}

// ---- Spinner ----
export function Spinner({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg className={cn('animate-spin text-current', className)} width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

// ---- EmptyState ----
export function EmptyState({ icon, title, description, action }: {
  icon?: React.ReactNode; title: string; description?: string; action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {icon && <div className="mb-4 text-slate-300">{icon}</div>}
      <h3 className="text-lg font-semibold text-slate-800 mb-2">{title}</h3>
      {description && <p className="text-slate-500 text-sm max-w-md mb-6">{description}</p>}
      {action}
    </div>
  );
}

// ---- ErrorState ----
export function ErrorState({ message, retry }: { message: string; retry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">!</div>
      <h3 className="text-lg font-semibold text-slate-800 mb-2">Something went wrong</h3>
      <p className="text-slate-500 text-sm max-w-md mb-6">{message}</p>
      {retry && <Button variant="secondary" onClick={retry}>Try again</Button>}
    </div>
  );
}

// ---- Modal ----
export function Modal({ open, onClose, title, children, footer }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode; footer?: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg animate-slide-up">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
        <div className="p-5">{children}</div>
        {footer && <div className="flex justify-end gap-3 p-5 border-t border-slate-100">{footer}</div>}
      </div>
    </div>
  );
}

// ---- StarRating (display) ----
export function StarRating({ rating, max = 10, size = 16 }: { rating: number; max?: number; size?: number }) {
  const filled = Math.round((rating / max) * 5);
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24"
          fill={i < filled ? '#f59e0b' : 'none'}
          stroke={i < filled ? '#f59e0b' : '#cbd5e1'}
          strokeWidth="2"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

// ---- StarRatingInput (interactive) ----
export function StarRatingInput({ value, onChange, max = 10 }: { value: number; onChange: (v: number) => void; max?: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }).map((_, i) => (
        <button key={i} type="button" onClick={() => onChange(i + 1)}
          className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-all',
            i < value ? 'bg-amber-100 text-amber-700 border border-amber-300' : 'bg-slate-50 text-slate-400 border border-slate-200 hover:bg-slate-100',
          )}
        >
          {i + 1}
        </button>
      ))}
    </div>
  );
}
