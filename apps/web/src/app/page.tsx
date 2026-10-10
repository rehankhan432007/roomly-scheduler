import { Logo, Button, Card, Badge, cn } from '@/design-system';
import Link from 'next/link';
import { Search, MapPin, Zap, CheckCircle2, QrCode, Clock, Star, MessageSquare, AlertCircle } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      {/* Sticky Top Nav */}
      <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-line">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <Logo />
          <nav className="hidden md:flex items-center gap-6">
            <a href="#how-it-works" className="text-small font-medium text-muted hover:text-ink transition-colors">How it works</a>
            <a href="#features" className="text-small font-medium text-muted hover:text-ink transition-colors">Features</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Log in</Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Get started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="py-20 md:py-32 px-4 md:px-6 text-center max-w-[900px] mx-auto">
          <Badge tone="primary" className="mb-6">MeetMaze is here</Badge>
          <h1 className="text-display font-bold text-ink tracking-tight mb-6">
            Meet Without The Maze
          </h1>
          <p className="text-h2 text-muted mb-10 max-w-[700px] mx-auto leading-relaxed">
            Seamlessly list, discover, and book meeting spaces — and let smart matching resolve the clashes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register?role=CLIENT" className="w-full sm:w-auto">
              <Button size="lg" fullWidth leftIcon={<Search className="w-5 h-5" />}>Find a room</Button>
            </Link>
            <Link href="/register?role=OWNER" className="w-full sm:w-auto">
              <Button variant="secondary" size="lg" fullWidth leftIcon={<MapPin className="w-5 h-5" />}>List your rooms</Button>
            </Link>
          </div>
        </section>

      </main>


      <footer className="bg-surface border-t border-line py-8 mt-auto">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo size="sm" />
          <p className="text-small text-muted">Team EightBit · CBC045 · SJB Institute of Technology</p>
        </div>
      </footer>
    </div>
  );
}
