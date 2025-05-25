
import type {Metadata} from 'next';
import {Geist, Geist_Mono} from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { StudyProvider } from '@/context/StudyContext';
import Navbar from '@/components/layout/Navbar';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'StudySmarts: AI Document Summarizer & Quiz Generator',
  description: 'Upload documents, get AI summaries and quizzes with StudySmarts.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground flex flex-col min-h-screen`}>
        <StudyProvider>
          <Navbar />
          <main className="flex-grow w-full"> {/* Ensures children take up remaining space */}
            {children}
          </main>
          <Toaster />
        </StudyProvider>
      </body>
    </html>
  );
}
