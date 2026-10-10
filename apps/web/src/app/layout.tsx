// Root layout
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from '@/core/providers';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'MeetMaze — Meet Without The Maze',
  description: 'Seamlessly list, discover, and book meeting spaces — and let smart matching resolve the clashes.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
