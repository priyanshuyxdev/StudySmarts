
import type { Metadata } from 'next';
import Link from 'next/link';
import { Users, BookCopy, LayoutDashboard } from 'lucide-react';

export const metadata: Metadata = {
  title: 'StudySmarts Dashboard',
  description: 'Manage your StudySmarts activities.',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="bg-primary text-primary-foreground p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold flex items-center">
            <BookCopy className="mr-2 h-7 w-7" /> StudySmarts
          </Link>
          <nav className="space-x-4">
            <Link href="/dashboard/student" className="hover:underline flex items-center">
              <Users className="mr-1 h-5 w-5" /> Student View
            </Link>
            <Link href="/dashboard/teacher" className="hover:underline flex items-center">
              <LayoutDashboard className="mr-1 h-5 w-5" /> Teacher View
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-grow container mx-auto p-4 md:p-8">
        {children}
      </main>
      <footer className="text-center p-4 text-muted-foreground text-sm border-t border-border">
        &copy; {new Date().getFullYear()} StudySmarts Dashboard
      </footer>
    </div>
  );
}
