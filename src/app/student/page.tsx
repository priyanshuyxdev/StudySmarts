
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStudyContext } from '@/context/StudyContext';
import QuizDisplay from '@/components/study-smarts/QuizDisplay';
// Removed: import SummaryDisplay from '@/components/study-smarts/SummaryDisplay';
import DownloadStudyAidsButton from '@/components/study-smarts/DownloadStudyAidsButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function StudentPage() {
  const { currentUser, teacherQuizData } = useStudyContext();
  const router = useRouter();

  useEffect(() => {
    if (currentUser === null) {
      // If not logged in at all, redirect to home, navbar will offer login
      router.push('/');
    } else if (currentUser.role !== 'student') {
      // If logged in but not as student, redirect to home
      router.push('/');
    }
  }, [currentUser, router]);

  if (!currentUser || currentUser.role !== 'student') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Redirecting...</p>
      </div>
    );
  }

  if (!teacherQuizData) {
    return (
      <main className="w-full max-w-2xl mx-auto space-y-6 p-4 md:p-8 mt-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="mr-2 h-6 w-6 text-yellow-500" />
              No Quiz Available
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Your teacher has not set a quiz yet. Please check back later.
            </p>
            <Button onClick={() => router.push('/')} className="mt-4">Go to Home</Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="w-full max-w-4xl mx-auto space-y-6 p-4 md:p-8 mt-4">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <CheckCircle className="mr-2 h-7 w-7 text-green-500" />
            Assigned Quiz: {teacherQuizData.documentName}
          </CardTitle>
          <CardDescription>
            This quiz has been assigned by your teacher. Please complete it. Your results will be shown at the end.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* SummaryDisplay is removed for students */}

      <div className="mt-6">
        <QuizDisplay
          quiz={teacherQuizData.quiz}
          onQuizChange={() => {}} // No-op as students can't edit
          isLoading={false}
          // documentSummary prop is removed for students
          documentName={teacherQuizData.documentName} // Pass documentName for recording attempts
          isEditable={false} // Explicitly set to false for students
        />
      </div>
      
      <DownloadStudyAidsButton
        summary={teacherQuizData.summary} // Still needed for student download if they want the summary
        quiz={teacherQuizData.quiz}
        documentName={teacherQuizData.documentName}
        isCustomQuiz={teacherQuizData.documentName.toLowerCase().startsWith("custom quiz:")}
      />
       <footer className="w-full text-center p-4 mt-8">
        <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} StudySmarts. Student Portal.</p>
      </footer>
    </main>
  );
}
