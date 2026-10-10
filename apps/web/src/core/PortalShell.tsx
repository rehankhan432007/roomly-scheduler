// Portal Shell — Sidebar + Topbar + mobile drawer
'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo, Avatar, cn } from '@/design-system';
import { Slot } from '@/core/Slot';
import { getNavItems } from '@/core/nav';
import { useAuth } from '@/core/auth/store';
import { Menu, X, LogOut, User, ChevronDown } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

function getIcon(iconName: string) {
  const Icon = (LucideIcons as Record<string, React.ComponentType<{ className?: string }>>)[iconName];
  return Icon ?? LucideIcons.Circle;
}

interface PortalShellProps {
  role: 'CLIENT' | 'OWNER';
  children: ReactNode;
}

export function PortalShell({ role, children }: PortalShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const pathname = usePathname();
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const navItems = getNavItems(role);

  const portalSlotName = role === 'CLIENT' ? 'client.global' : 'owner.global';

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar - desktop */}
      <aside className="hidden lg:flex lg:flex-col w-[248px] bg-ink text-white flex-shrink-0">
        <div className="p-5 border-b border-white/10">
          <Link href={role === 'CLIENT' ? '/client' : '/owner/dashboard'}>
            <Logo variant="light" />
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = getIcon(item.icon);
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-control text-small font-medium transition-colors',
                  active
                    ? 'bg-white/10 text-white border-l-[3px] border-accent'
                    : 'text-white/70 hover:bg-white/5 hover:text-white',
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/10">
          <p className="text-caption text-white/50">Team EightBit · CBC045</p>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/60" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-[280px] max-w-[80vw] h-full bg-ink text-white flex flex-col animate-in slide-in-from-left">
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <Logo variant="light" />
              <button onClick={() => setSidebarOpen(false)} className="text-white/70 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
              {navItems.map((item) => {
                const Icon = getIcon(item.icon);
                const active = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-control text-small font-medium transition-colors',
                      active ? 'bg-white/10 text-white border-l-[3px] border-accent' : 'text-white/70 hover:bg-white/5 hover:text-white',
                    )}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-surface border-b border-line flex items-center justify-between px-4 md:px-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-muted hover:text-ink">
              <Menu className="w-5 h-5" />
            </button>
            <div className="lg:hidden">
              <Logo size="sm" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Slot name="header.right" />

            {/* User menu */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 hover:bg-canvas rounded-control px-2 py-1.5 transition-colors"
                >
                  <Avatar name={user.name} size="sm" />
                  <span className="hidden sm:block text-small font-medium text-ink">{user.name}</span>
                  <ChevronDown className="w-4 h-4 text-muted" />
                </button>

                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-1 w-48 bg-surface rounded-card shadow-pop border border-line py-1 z-50">
                      <div className="px-3 py-2 border-b border-line">
                        <p className="text-small font-medium text-ink">{user.name}</p>
                        <p className="text-caption text-muted">{user.email}</p>
                      </div>
                      <Link
                        href="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-small text-ink hover:bg-canvas transition-colors"
                      >
                        <User className="w-4 h-4" />
                        Profile
                      </Link>
                      <button
                        onClick={() => { setUserMenuOpen(false); logout(); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-small text-danger hover:bg-danger-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign out
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto bg-canvas">
          <div className="max-w-[1200px] mx-auto px-4 md:px-6 lg:px-8 py-6">
            {children}
          </div>
        </main>
      </div>

      {/* Global slot for modals/overlays */}
      <Slot name={portalSlotName as 'client.global' | 'owner.global'} />
    </div>
  );
}
