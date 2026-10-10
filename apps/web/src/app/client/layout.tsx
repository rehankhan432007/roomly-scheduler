import Link from 'next/link';
import { Calendar, Search, ListTodo } from 'lucide-react';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      <header className="bg-background border-b h-16 flex items-center px-6 sticky top-0 z-40">
        <div className="flex-1 font-bold text-xl text-primary">MeetMaze</div>
        <nav className="flex space-x-4">
          <Link href="/client/search" className="flex items-center space-x-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            <Search className="w-4 h-4" />
            <span>Search</span>
          </Link>
          <Link href="/client/bookings" className="flex items-center space-x-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            <ListTodo className="w-4 h-4" />
            <span>My Bookings</span>
          </Link>
          <Link href="/client/calendar" className="flex items-center space-x-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            <Calendar className="w-4 h-4" />
            <span>Calendar</span>
          </Link>
        </nav>
      </header>
      <main className="flex-1 p-6 container mx-auto max-w-6xl">
        {children}
      </main>
    </div>
  );
}
