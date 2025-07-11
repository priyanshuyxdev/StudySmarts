
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
      // Allow access if loading or explicitly navigating to student page
    } else if (currentUser.role !== 'student') {
      router.push('/'); // Redirect non-students
    }
  }, [currentUser, router]);

  // If currentUser is still loading (null) and no teacherQuizData, show loading
  if (currentUser === null && !teacherQuizData) {
     return (
      <div className="flex flex-col items-center justify-center flex-grow p-4 bg-gradient-to-br from-slate-50 to-sky-100 dark:from-slate-900 dark:to-sky-950">
        <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-primary mb-4" />
        <p className="text-base sm:text-lg text-muted-foreground">Loading student portal...</p>
      </div>
    );
  }
  
  // If logged in but not as student, this should ideally be caught by useEffect redirect
  // but as a fallback:
  if (currentUser && currentUser.role !== 'student') {
    return (
      <div className="flex flex-col items-center justify-center flex-grow p-4 bg-gradient-to-br from-slate-50 to-sky-100 dark:from-slate-900 dark:to-sky-950">
        <AlertCircle className="h-10 w-10 sm:h-12 sm:w-12 text-destructive mb-4" />
        <p className="text-base sm:text-lg text-destructive">Access Denied. Redirecting...</p>
      </div>
    );
  }


  if (!teacherQuizData) {
    return (
      <div className="flex flex-col flex-grow items-center justify-center bg-gradient-to-br from-slate-50 to-sky-100 dark:from-slate-900 dark:to-sky-950 p-4">
        <main className="w-full max-w-lg sm:max-w-2xl mx-auto space-y-6">
          <Card className="shadow-xl border-primary/50 rounded-xl">
            <CardHeader className="bg-gradient-to-r from-sky-50 to-cyan-50 dark:from-sky-900/30 dark:to-cyan-900/30 p-4 sm:p-6 rounded-t-xl">
              <CardTitle className="flex items-center text-base sm:text-xl">
                <Smile className="mr-2 h-6 w-6 sm:h-7 sm:w-7 text-primary" />
                No Quiz Available Yet!
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center p-4 sm:p-6">
              <p className="text-muted-foreground mb-4 text-sm sm:text-base">
                Your teacher hasn't set a quiz yet. Please check back later or enjoy your free time!
              </p>
              <img 
                data-ai-hint="relaxing student" 
                src="https://placehold.co/300x200.png" 
                alt="Relaxing student illustration" 
                className="mx-auto rounded-md shadow-md mb-6 w-full max-w-xs sm:max-w-sm" 
              />
              <Button onClick={() => router.push('/')} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-shadow rounded-lg py-2.5 px-5 sm:py-3 sm:px-6 text-sm sm:text-base">
                Go to Home Page
              </Button>
            </CardContent>
          </Card>
        </main>
         <footer className="w-full text-center p-4 mt-auto">
          {/* <p className="text-xs sm:text-sm text-muted-foreground">Made by Priyanshu</p> */}
          <p className="text-xs sm:text-sm text-muted-foreground">&copy; {new Date().getFullYear()} StudySmarts. Student Portal.</p>
        </footer>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-grow items-center bg-gradient-to-br from-slate-50 to-sky-100 dark:from-slate-900 dark:to-sky-950">
      <main className="w-full max-w-3xl mx-auto space-y-6 p-4 md:p-8 mt-4"> {/* Max width slightly reduced for better mobile */}
        <Card className="shadow-xl rounded-xl">
           <CardHeader className="bg-gradient-to-r from-green-50 to-lime-50 dark:from-green-900/30 dark:to-lime-900/30 p-4 sm:p-6 rounded-t-xl">
            <CardTitle className="flex items-center text-base sm:text-xl">
              <CheckCircle className="mr-2 h-6 w-6 sm:h-7 sm:w-7 text-green-600 dark:text-green-400" />
              Assigned Quiz
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              This quiz, "{teacherQuizData.documentName}", has been assigned by your teacher. Please complete it. Your results will be shown at the end.
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="mt-4 sm:mt-6">
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
          downloadType="full"
          className="mt-4 sm:mt-6 text-xs sm:text-sm"
        />
      </main>
       <footer className="w-full text-center p-4 mt-auto"> 
        {/* <p className="text-xs sm:text-sm text-muted-foreground">Made by Priyanshu</p> */}
        <p className="text-xs sm:text-sm text-muted-foreground">&copy; {new Date().getFullYear()} StudySmarts. Student Portal.</p>
      </footer>
    </div>
  );
}
