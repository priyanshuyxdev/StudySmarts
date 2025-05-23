
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStudyContext } from '@/context/StudyContext';
import QuizDisplay from '@/components/study-smarts/QuizDisplay';
import DownloadStudyAidsButton from '@/components/study-smarts/DownloadStudyAidsButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle, Loader2, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function StudentPage() {
  const { currentUser, teacherQuizData } = useStudyContext();
  const router = useRouter();

  useEffect(() => {
    if (currentUser === null) {
      router.push('/');
    } else if (currentUser.role !== 'student') {
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
        <Card className="shadow-lg border-primary/50">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Smile className="mr-2 h-7 w-7 text-primary" />
              No Quiz Available Yet!
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              Your teacher hasn't set a quiz yet. Please check back later or enjoy your free time!
            </p>
            <img 
              data-ai-hint="relaxing student" 
              src="https://placehold.co/400x250.png" 
              alt="Relaxing student illustration" 
              className="mx-auto rounded-md shadow-md mb-4" 
            />
            <Button onClick={() => router.push('/')} className="mt-4 bg-primary hover:bg-primary/90 text-primary-foreground">
              Go to Home Page
            </Button>
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
            Assigned Quiz
          </CardTitle>
          <CardDescription>
            This quiz, "{teacherQuizData.documentName}", has been assigned by your teacher. Please complete it. Your results will be shown at the end.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="mt-6">
        <QuizDisplay
          quiz={teacherQuizData.quiz}
          onQuizChange={() => {}} 
          isLoading={false}
          documentName={teacherQuizData.documentName}
          isEditable={false} 
        />
      </div>
      
      <DownloadStudyAidsButton
        summary={teacherQuizData.summary} 
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

    