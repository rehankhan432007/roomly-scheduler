'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { features } from '@/core/features.generated';

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Aggregate owner nav items from all features
  const navItems = features
    .flatMap(f => f.navItems || [])
    .filter(item => item.portal === 'owner')
    .sort((a, b) => a.order - b.order);

  return (
    <div className="flex h-screen overflow-hidden bg-canvas">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-ink text-white flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-white/10">
          <span className="font-bold tracking-tight text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-accent flex items-center justify-center text-xs">M</span>
            MeetMaze
          </span>
          <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-white/10 text-white/70">Owner</span>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map(item => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link key={item.id} href={item.href} className={`flex items-center gap-3 px-3 py-2 rounded-control text-small font-medium transition-colors ${isActive ? 'bg-primary text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
                {item.label}
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-small font-bold">O</div>
            <div className="flex-1 min-w-0">
              <p className="text-small font-medium truncate">Owner Account</p>
              <p className="text-caption text-white/50 truncate">Orbit Workspaces</p>
            </div>
          </div>
        </div>
      </aside>
      
      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {/* Top header (optional, mostly for mobile toggle in real app) */}
        <header className="h-16 bg-surface border-b border-line/60 flex items-center justify-end px-6 sticky top-0 z-10 shadow-sm">
          <button className="text-small font-medium text-muted hover:text-ink">Log out</button>
        </header>
        <div className="p-4 sm:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
