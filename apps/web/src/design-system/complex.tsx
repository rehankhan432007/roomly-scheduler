import React, { useEffect } from 'react';
import { cn, Button } from './core';

export function Modal({ open, onClose, title, description, footer, size = 'md', children }: {
  open: boolean; onClose: () => void; title: string; description?: string; footer?: React.ReactNode; size?: 'sm'|'md'|'lg'; children: React.ReactNode;
}) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [open, onClose]);

  if (!open) return null;

  const sizes = { sm: 'max-w-md', md: 'max-w-2xl', lg: 'max-w-4xl' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className={cn("relative w-full bg-surface rounded-card shadow-pop flex flex-col max-h-full overflow-hidden", sizes[size])}>
        <div className="flex-shrink-0 flex items-center justify-between p-5 border-b border-line/60">
          <div>
            <h2 className="text-h2 font-semibold text-ink">{title}</h2>
            {description && <p className="text-small text-muted mt-1">{description}</p>}
          </div>
          <button onClick={onClose} className="text-muted hover:text-ink transition-colors p-1" aria-label="Close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
        {footer && <div className="flex-shrink-0 p-5 border-t border-line/60 bg-canvas/50">{footer}</div>}
      </div>
    </div>
  );
}

export function Drawer({ open, onClose, title, description, footer, size = 'md', children }: {
  open: boolean; onClose: () => void; title: string; description?: string; footer?: React.ReactNode; size?: 'sm'|'md'|'lg'; children: React.ReactNode;
}) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [open, onClose]);

  if (!open) return null;
  const sizes = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-xl' };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className={cn("relative w-full h-full bg-surface shadow-pop flex flex-col animate-in slide-in-from-right", sizes[size])}>
        <div className="flex-shrink-0 flex items-center justify-between p-5 border-b border-line/60">
          <div>
            <h2 className="text-h2 font-semibold text-ink">{title}</h2>
            {description && <p className="text-small text-muted mt-1">{description}</p>}
          </div>
          <button onClick={onClose} className="text-muted hover:text-ink transition-colors p-1" aria-label="Close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
        {footer && <div className="flex-shrink-0 p-5 border-t border-line/60 bg-canvas/50">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, onConfirm, onCancel, title, message, confirmLabel = 'Confirm', tone = 'default', loading }: {
  open: boolean; onConfirm: () => void; onCancel: () => void; title: string; message: string; confirmLabel?: string; tone?: 'default' | 'danger'; loading?: boolean;
}) {
  return (
    <Modal open={open} onClose={onCancel} title={title} size="sm" footer={
      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={onCancel} disabled={loading}>Cancel</Button>
        <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
      </div>
    }>
      <p className="text-body text-ink">{message}</p>
    </Modal>
  );
}

export function DataTable<T>({ columns, rows, rowKey, onRowClick, loading, empty, pagination }: {
  columns: { key: string; header: string; render?: (row: T) => React.ReactNode; align?: 'left'|'right'|'center'; width?: string }[];
  rows: T[]; rowKey: (row: T) => string; onRowClick?: (row: T) => void; loading?: boolean; empty?: React.ReactNode;
  pagination?: { page: number; pageSize: number; total: number; onPageChange: (page: number) => void };
}) {
  if (loading && rows.length === 0) return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-2 border-line border-t-primary" /></div>;
  if (!loading && rows.length === 0) return <div className="border border-line/60 rounded-card overflow-hidden">{empty}</div>;

  return (
    <div className="border border-line/60 rounded-card overflow-hidden bg-surface">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-body">
          <thead className="bg-canvas border-b border-line/60">
            <tr>
              {columns.map(c => (
                <th key={c.key} className={cn("px-4 py-3 font-medium text-muted text-small", c.align === 'right' && 'text-right', c.align === 'center' && 'text-center')} style={{ width: c.width }}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line/60">
            {rows.map(row => (
              <tr key={rowKey(row)} onClick={() => onRowClick?.(row)} className={cn("transition-colors", onRowClick && "cursor-pointer hover:bg-canvas/50")}>
                {columns.map(c => (
                  <td key={c.key} className={cn("px-4 py-3", c.align === 'right' && 'text-right', c.align === 'center' && 'text-center')}>
                    {c.render ? c.render(row) : String((row as any)[c.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pagination && pagination.total > pagination.pageSize && (
        <div className="px-4 py-3 border-t border-line/60 bg-canvas/50 flex items-center justify-between">
          <span className="text-small text-muted">Showing {((pagination.page - 1) * pagination.pageSize) + 1} to {Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total}</span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" disabled={pagination.page <= 1} onClick={() => pagination.onPageChange(pagination.page - 1)}>Prev</Button>
            <Button size="sm" variant="secondary" disabled={pagination.page * pagination.pageSize >= pagination.total} onClick={() => pagination.onPageChange(pagination.page + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function Tabs({ tabs, value, onChange }: {
  tabs: { id: string; label: string; badge?: React.ReactNode }[]; value: string; onChange: (val: string) => void;
}) {
  return (
    <div className="flex items-center space-x-6 border-b border-line/60 overflow-x-auto no-scrollbar">
      {tabs.map(tab => {
        const active = tab.id === value;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-body whitespace-nowrap transition-colors",
              active ? "border-primary text-primary-700" : "border-transparent text-muted hover:text-ink hover:border-line"
            )}
          >
            {tab.label}
            {tab.badge}
          </button>
        );
      })}
    </div>
  );
}
