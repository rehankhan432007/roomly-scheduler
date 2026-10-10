import React from 'react';
import { cn, Card } from './core';

export function PageHeader({ title, description, actions, breadcrumbs }: {
  title: string; description?: string; actions?: React.ReactNode; breadcrumbs?: React.ReactNode;
}) {
  return (
    <div className="mb-8">
      {breadcrumbs && <div className="mb-2 text-small text-muted">{breadcrumbs}</div>}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-h1 font-semibold text-ink">{title}</h1>
          {description && <p className="text-body text-muted mt-1">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>
    </div>
  );
}

export function StatCard({ label, value, delta, icon, tone = 'primary' }: {
  label: string; value: string | number; delta?: string; icon?: React.ReactNode; tone?: 'primary'|'success'|'warning'|'danger'|'neutral';
}) {
  const tones = {
    primary: 'text-primary bg-primary-50',
    success: 'text-success bg-success-50',
    warning: 'text-warning bg-warning-50',
    danger: 'text-danger bg-danger-50',
    neutral: 'text-ink bg-canvas',
  };
  return (
    <Card padding="md" className="flex flex-col">
      <div className="flex items-start justify-between mb-2">
        <span className="text-small font-medium text-muted">{label}</span>
        {icon && <div className={cn("p-2 rounded-control", tones[tone])}>{icon}</div>}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-h1 font-bold text-ink">{value}</span>
        {delta && <span className="text-caption font-medium text-success">{delta}</span>}
      </div>
    </Card>
  );
}

export function EquipmentChip({ code, name, icon, status = 'WORKING', matched, quantity = 1 }: {
  code: string; name: string; icon: React.ReactNode; status?: 'WORKING'|'FAULTY'|'MAINTENANCE'; matched?: boolean; quantity?: number;
}) {
  const isFaulty = status === 'FAULTY' || status === 'MAINTENANCE';
  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill text-caption font-medium border",
      isFaulty ? "bg-danger-50 text-danger border-danger-50" : "bg-canvas text-ink border-line",
      matched === false && "opacity-50 line-through"
    )}>
      {icon}
      <span>{name} {quantity > 1 ? `(${quantity})` : ''}</span>
      {isFaulty && <span className="ml-1" title={status}>⚠️</span>}
    </div>
  );
}

export function TimeSlotGrid({ slots, selected, onSelect, timezone }: {
  slots: { startAt: string; endAt: string; state: string }[];
  selected?: string; onSelect?: (startAt: string) => void; timezone: string;
}) {
  return (
    <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
      {slots.map(s => {
        const time = new Date(s.startAt).toLocaleTimeString('en-US', { timeZone: timezone, hour: '2-digit', minute: '2-digit' });
        const free = s.state === 'FREE';
        const isSelected = selected === s.startAt;
        return (
          <button
            key={s.startAt}
            disabled={!free}
            onClick={() => free && onSelect?.(s.startAt)}
            className={cn(
              "py-2 px-1 text-caption font-medium rounded-control text-center transition-colors border",
              isSelected ? "bg-primary text-white border-primary" :
              free ? "bg-surface text-ink border-line hover:border-primary hover:text-primary" :
              "bg-canvas text-muted border-transparent opacity-50 cursor-not-allowed"
            )}
            title={s.state}
          >
            {time}
          </button>
        );
      })}
    </div>
  );
}
