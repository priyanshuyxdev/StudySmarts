
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

interface StudyContextType {
  currentUser: CurrentUser | null;
  teacherQuizData: TeacherQuizData | null;
  loginUser: (role: 'student' | 'teacher', idInput: string, passwordInput: string) => boolean;
  logoutUser: () => void;
  setTeacherQuizData: (data: TeacherQuizData) => void;
}

const TEACHER_ID = "vikas sir";
const TEACHER_PASSWORD = "vikas123";
const STUDENT_ID = "priyanshu";
const STUDENT_PASSWORD = "21221079";

const StudyContext = createContext<StudyContextType | undefined>(undefined);

export function StudyProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [teacherQuizData, setTeacherQuizDataState] = useState<TeacherQuizData | null>(null);
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
    setCurrentUser(null);
    // Optionally clear teacherQuizData on logout, or keep it available if a teacher logs back in
    // setTeacherQuizDataState(null); 
    toast({ title: "Logged Out", description: "You have been successfully logged out." });
  }, [toast]);

  const setTeacherQuizData = useCallback((data: TeacherQuizData) => {
    setTeacherQuizDataState(data);
    toast({ title: "Quiz Set", description: "The quiz has been set for students." });
  }, [toast]);

  return (
    <StudyContext.Provider value={{ currentUser, loginUser, logoutUser, teacherQuizData, setTeacherQuizData }}>
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
