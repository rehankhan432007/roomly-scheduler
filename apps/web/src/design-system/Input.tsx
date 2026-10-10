// Input, Textarea, Select components
'use client';

import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type ReactNode } from 'react';
import { cn } from './utils';

interface BaseFieldProps {
  label?: string;
  hint?: string;
  error?: string;
  leftIcon?: ReactNode;
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement>, BaseFieldProps {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, leftIcon, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-small font-medium text-ink">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">{leftIcon}</div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full h-10 px-3 text-body bg-surface border border-line rounded-control',
              'placeholder:text-muted/60 transition-colors duration-150',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary',
              'disabled:opacity-50 disabled:bg-canvas',
              error && 'border-danger focus:ring-danger',
              leftIcon && 'pl-10',
              className,
            )}
            {...props}
          />
        </div>
        {hint && !error && <p className="text-small text-muted">{hint}</p>}
        {error && <p className="text-small text-danger">{error}</p>}
      </div>
    );
  },
);
Input.displayName = 'Input';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement>, BaseFieldProps {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, hint, error, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-small font-medium text-ink">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            'w-full px-3 py-2 text-body bg-surface border border-line rounded-control min-h-[80px]',
            'placeholder:text-muted/60 transition-colors duration-150',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary',
            error && 'border-danger focus:ring-danger',
            className,
          )}
          {...props}
        />
        {hint && !error && <p className="text-small text-muted">{hint}</p>}
        {error && <p className="text-small text-danger">{error}</p>}
      </div>
    );
  },
);
Textarea.displayName = 'Textarea';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement>, BaseFieldProps {
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, hint, error, options, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-small font-medium text-ink">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={inputId}
          className={cn(
            'w-full h-10 px-3 text-body bg-surface border border-line rounded-control',
            'transition-colors duration-150 appearance-none',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary',
            error && 'border-danger focus:ring-danger',
            className,
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {hint && !error && <p className="text-small text-muted">{hint}</p>}
        {error && <p className="text-small text-danger">{error}</p>}
      </div>
    );
  },
);
Select.displayName = 'Select';
