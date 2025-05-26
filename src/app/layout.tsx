
import type {Metadata} from 'next';
import {Geist, Geist_Mono} from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { StudyProvider } from '@/context/StudyContext';
import Navbar from '@/components/layout/Navbar';
import { Analytics } from '@vercel/analytics/next';

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
  description: 'Elevate your learning with StudySmarts: AI-powered document summarization, custom quiz generation, interactive flashcards, and an AI chatbot to help you understand and retain information more effectively. Process PDFs, get study aids, and test your knowledge.',
  openGraph: {
    title: 'StudySmarts: AI Learning Assistant',
    description: 'AI-powered summaries, quizzes, and study tools.',
    type: 'website',
    // Add a URL to your deployed site here if available
    // url: 'https://your-studysmarts-url.com',
    // Add a URL to an image for social sharing here if available
    // images: ['https://your-studysmarts-url.com/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'StudySmarts: AI Learning Assistant',
    description: 'AI-powered summaries, quizzes, and study tools.',
    // Add a Twitter handle here if available
    // creator: '@yourTwitterHandle',
    // Add a URL to an image for Twitter cards here if available
    // images: ['https://your-studysmarts-url.com/twitter-image.png'],
  },
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
            <Analytics />

          </main>
          <Toaster />
        </StudyProvider>
      </body>
    </html>
  );
}
