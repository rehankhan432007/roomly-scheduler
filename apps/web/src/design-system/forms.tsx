import React from 'react';
import { cn } from './core';

export interface FormFieldProps {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function FormField({ label, htmlFor, hint, error, required, children, className }: FormFieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-small font-medium text-ink">
        {label} {required && <span className="text-danger">*</span>}
      </label>
      {children}
      {error && <p className="text-caption text-danger">{error}</p>}
      {!error && hint && <p className="text-caption text-muted">{hint}</p>}
    </div>
  );
}

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { leftIcon?: React.ReactNode, error?: string }>(
  ({ className, leftIcon, error, ...props }, ref) => {
    return (
      <div className="relative">
        {leftIcon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">{leftIcon}</div>}
        <input
          ref={ref}
          className={cn(
            "flex h-10 w-full rounded-control border bg-surface px-3 py-2 text-body transition-colors",
            "file:border-0 file:bg-transparent file:text-small file:font-medium",
            "placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:cursor-not-allowed disabled:opacity-50",
            error ? "border-danger focus:ring-danger" : "border-line",
            leftIcon && "pl-10",
            className
          )}
          {...props}
        />
      </div>
    );
  }
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: string }>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "flex min-h-[80px] w-full rounded-control border bg-surface px-3 py-2 text-body transition-colors",
          "placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:cursor-not-allowed disabled:opacity-50",
          error ? "border-danger focus:ring-danger" : "border-line",
          className
        )}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[];
  error?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, options, error, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          "flex h-10 w-full rounded-control border bg-surface px-3 py-2 text-body transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:cursor-not-allowed disabled:opacity-50",
          error ? "border-danger focus:ring-danger" : "border-line",
          className
        )}
        {...props}
      >
        <option value="" disabled hidden>Select an option</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    );
  }
);
Select.displayName = "Select";

export const Switch = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { label?: string }>(
  ({ className, label, checked, onChange, ...props }, ref) => {
    return (
      <label className={cn("flex items-center gap-3 cursor-pointer", className)}>
        <div className="relative">
          <input type="checkbox" className="sr-only" checked={checked} onChange={onChange} ref={ref} {...props} />
          <div className={cn("block w-10 h-6 rounded-full transition-colors", checked ? "bg-primary" : "bg-line")} />
          <div className={cn("absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform", checked && "transform translate-x-4")} />
        </div>
        {label && <span className="text-body font-medium text-ink">{label}</span>}
      </label>
    );
  }
);
Switch.displayName = "Switch";

export function NumberStepper({ value, onChange, min = 0, max = 100, step = 1, label, unit }: {
  value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; label?: string; unit?: string;
}) {
  const dec = () => onChange(Math.max(min, value - step));
  const inc = () => onChange(Math.min(max, value + step));
  return (
    <div className="flex items-center gap-3">
      {label && <span className="text-small font-medium text-ink">{label}</span>}
      <div className="flex items-center border border-line rounded-control bg-surface h-10 overflow-hidden">
        <button type="button" onClick={dec} disabled={value <= min} className="px-3 hover:bg-canvas disabled:opacity-50 transition-colors">-</button>
        <div className="px-2 text-body font-medium min-w-[3rem] text-center">{value}</div>
        <button type="button" onClick={inc} disabled={value >= max} className="px-3 hover:bg-canvas disabled:opacity-50 transition-colors">+</button>
      </div>
      {unit && <span className="text-small text-muted">{unit}</span>}
    </div>
  );
}

export function ChipToggle({ selected, onToggle, icon, children }: { selected: boolean; onToggle: () => void; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "inline-flex items-center h-8 px-3 rounded-pill text-small font-medium transition-colors border focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1",
        selected ? "bg-primary-50 border-primary text-primary-700" : "bg-surface border-line text-ink hover:bg-canvas"
      )}
    >
      {icon && <span className="mr-1.5">{icon}</span>}
      {children}
    </button>
  );
}
