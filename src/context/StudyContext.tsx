
"use client";

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useCallback } from 'react';
import type { SummarizeDocumentOutput } from '@/ai/flows/summarize-document';
import type { GenerateQuizOutput } from '@/ai/flows/generate-quiz';
import { useToast } from "@/hooks/use-toast";

interface CurrentUser {
  role: 'student' | 'teacher';
  id: string;
}

interface TeacherQuizData {
  quiz: GenerateQuizOutput;
  summary: SummarizeDocumentOutput;
  documentName: string;
}

interface StudentAttempt {
  studentId: string;
  score: number;
  totalQuestions: number;
  quizName: string;
  timestamp: number;
}

interface StudyContextType {
  currentUser: CurrentUser | null;
  teacherQuizData: TeacherQuizData | null;
  studentAttempts: StudentAttempt[];
  loginUser: (role: 'student' | 'teacher', idInput: string, passwordInput: string) => boolean;
  logoutUser: () => void;
  setTeacherQuizData: (data: TeacherQuizData) => void;
  recordStudentAttempt: (attempt: Omit<StudentAttempt, 'timestamp'>) => void;
}

const TEACHER_ID = "vikas sir";
const TEACHER_PASSWORD = "vikas123";
const STUDENT_ID = "priyanshu";
const STUDENT_PASSWORD = "21221079";

const StudyContext = createContext<StudyContextType | undefined>(undefined);

export function StudyProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [teacherQuizData, setTeacherQuizDataState] = useState<TeacherQuizData | null>(null);
  const [studentAttempts, setStudentAttempts] = useState<StudentAttempt[]>([]);
  const { toast } = useToast();

  const loginUser = useCallback((role: 'student' | 'teacher', idInput: string, passwordInput: string): boolean => {
    if (role === 'teacher') {
      if (idInput.toLowerCase() === TEACHER_ID && passwordInput === TEACHER_PASSWORD) {
        setCurrentUser({ role: 'teacher', id: TEACHER_ID });
        toast({ title: "Login Successful", description: "Welcome, Teacher!" });
        return true;
      }
    } else if (role === 'student') {
      if (idInput.toLowerCase() === STUDENT_ID && passwordInput === STUDENT_PASSWORD) {
        setCurrentUser({ role: 'student', id: STUDENT_ID });
        toast({ title: "Login Successful", description: "Welcome, Student!" });
        return true;
      }
    }
    toast({ variant: "destructive", title: "Login Failed", description: "Invalid ID or password." });
    return false;
  }, [toast]);

  const logoutUser = useCallback(() => {
    const previousRole = currentUser?.role;
    setCurrentUser(null);
    // If a teacher logs out, clear their "set" quiz.
    // Student attempts remain for now, as they are not tied to a session.
    if (previousRole === 'teacher') {
      // setTeacherQuizDataState(null); // Keep quiz data for now, teacher might log back in.
    }
    toast({ title: "Logged Out", description: "You have been successfully logged out." });
  }, [toast, currentUser]);

  const setTeacherQuizData = useCallback((data: TeacherQuizData) => {
    setTeacherQuizDataState(data);
    // When a new quiz is set by the teacher, clear attempts for the *previous* quiz from view if desired
    // Or, filter attempts on the display side. For now, we'll just add and display.
    toast({ title: "Quiz Set", description: `Quiz "${data.documentName}" is now active for students.` });
  }, [toast]);

  const recordStudentAttempt = useCallback((attempt: Omit<StudentAttempt, 'timestamp'>) => {
    setStudentAttempts(prevAttempts => {
      // Optionally, prevent duplicate submissions for the same quiz by the same student or update existing
      const newAttempt = { ...attempt, timestamp: Date.now() };
      // Simple add for now.
      return [...prevAttempts, newAttempt];
    });
    toast({ title: "Quiz Submitted", description: `Your score: ${attempt.score}/${attempt.totalQuestions}` });
  }, [toast]);

  return (
    <StudyContext.Provider value={{ 
      currentUser, 
      loginUser, 
      logoutUser, 
      teacherQuizData, 
      setTeacherQuizData,
      studentAttempts,
      recordStudentAttempt
    }}>
      {children}
    </StudyContext.Provider>
  );
}

export function useStudyContext() {
  const context = useContext(StudyContext);
  if (context === undefined) {
    throw new Error('useStudyContext must be used within a StudyProvider');
  }
  return context;
}
