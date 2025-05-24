
"use client";

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { SummarizeDocumentOutput } from '@/ai/flows/summarize-document';
import type { GenerateQuizOutput } from '@/ai/flows/generate-quiz';
import { useToast } from "@/hooks/use-toast";

const TEACHER_QUIZ_DATA_LOCALSTORAGE_KEY = "teacherQuizData_v2"; // Updated key if schema changes
const STUDENT_ATTEMPTS_LOCALSTORAGE_KEY = "studentAttempts_v2";
const CURRENT_USER_LOCALSTORAGE_KEY = "currentUser_v2"; // For persisting logged-in user

interface CurrentUser {
  role: 'student' | 'teacher';
  id: string;
}

interface TeacherQuizData {
  quiz: GenerateQuizOutput;
  summary: SummarizeDocumentOutput;
  documentName: string;
}

export interface StudentAttempt { // Exporting for use in StudySmartsPage
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
  clearTeacherQuizData: () => void;
  recordStudentAttempt: (attempt: Omit<StudentAttempt, 'timestamp'>) => void;
}

const teacherCredentials = [
  { id: "vikas", password: "vikas123" },
  { id: "teacher", password: "teacher123" },
];

const studentCredentials = [
  { id: "priyanshu", password: "priyanshu123" },
  { id: "tushar", password: "tushar123" },
  { id: "ritik", password: "ritik123" },
];

const StudyContext = createContext<StudyContextType | undefined>(undefined);

export function StudyProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [teacherQuizData, setTeacherQuizDataState] = useState<TeacherQuizData | null>(null);
  const [studentAttempts, setStudentAttempts] = useState<StudentAttempt[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // Load data from localStorage on initial mount
    try {
      const storedUser = localStorage.getItem(CURRENT_USER_LOCALSTORAGE_KEY);
      if (storedUser) {
        setCurrentUser(JSON.parse(storedUser));
      }

      const storedTeacherQuizData = localStorage.getItem(TEACHER_QUIZ_DATA_LOCALSTORAGE_KEY);
      if (storedTeacherQuizData) {
        setTeacherQuizDataState(JSON.parse(storedTeacherQuizData));
      }

      const storedStudentAttempts = localStorage.getItem(STUDENT_ATTEMPTS_LOCALSTORAGE_KEY);
      if (storedStudentAttempts) {
        setStudentAttempts(JSON.parse(storedStudentAttempts));
      }
    } catch (error) {
      console.error("Failed to load data from localStorage:", error);
      // Clear potentially corrupted data
      localStorage.removeItem(CURRENT_USER_LOCALSTORAGE_KEY);
      localStorage.removeItem(TEACHER_QUIZ_DATA_LOCALSTORAGE_KEY);
      localStorage.removeItem(STUDENT_ATTEMPTS_LOCALSTORAGE_KEY);
    }
  }, []);


  const loginUser = useCallback((role: 'student' | 'teacher', idInput: string, passwordInput: string): boolean => {
    let matchedUser: CurrentUser | null = null;
    if (role === 'teacher') {
      const foundTeacher = teacherCredentials.find(
        teacher => teacher.id.toLowerCase() === idInput.toLowerCase() && teacher.password === passwordInput
      );
      if (foundTeacher) matchedUser = { role: 'teacher', id: foundTeacher.id };
    } else if (role === 'student') {
      const foundStudent = studentCredentials.find(
        student => student.id.toLowerCase() === idInput.toLowerCase() && student.password === passwordInput
      );
      if (foundStudent) matchedUser = { role: 'student', id: foundStudent.id };
    }

    if (matchedUser) {
      setCurrentUser(matchedUser);
      localStorage.setItem(CURRENT_USER_LOCALSTORAGE_KEY, JSON.stringify(matchedUser));
      toast({ title: "Login Successful", description: `Welcome, ${matchedUser.role === 'teacher' ? 'Teacher ' : ''}${matchedUser.id}!` });
      return true;
    }
    
    toast({ variant: "destructive", title: "Login Failed", description: "Invalid ID or password." });
    return false;
  }, [toast]);

  const logoutUser = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem(CURRENT_USER_LOCALSTORAGE_KEY);
    // teacherQuizData and studentAttempts remain in localStorage for persistence across logins
    toast({ title: "Logged Out", description: "You have been successfully logged out." });
  }, [toast]);

  const setTeacherQuizData = useCallback((data: TeacherQuizData) => {
    setTeacherQuizDataState(data);
    try {
      localStorage.setItem(TEACHER_QUIZ_DATA_LOCALSTORAGE_KEY, JSON.stringify(data));
      toast({ title: "Quiz Set for Students", description: `Quiz "${data.documentName}" is now active.` });
    } catch (error) {
      console.error("Failed to save teacher quiz data to localStorage:", error);
      toast({ variant: "destructive", title: "Storage Error", description: "Could not save quiz data."});
    }
  }, [toast]);

  const clearTeacherQuizData = useCallback(() => {
    setTeacherQuizDataState(null);
    try {
      localStorage.removeItem(TEACHER_QUIZ_DATA_LOCALSTORAGE_KEY);
      toast({ title: "Active Quiz Cleared", description: "No quiz is currently active for students." });
    } catch (error) {
      console.error("Failed to remove teacher quiz data from localStorage:", error);
    }
  }, [toast]);


  const recordStudentAttempt = useCallback((attempt: Omit<StudentAttempt, 'timestamp'>) => {
    setStudentAttempts(prevAttempts => {
      const newAttempt = { ...attempt, timestamp: Date.now() };
      const updatedAttempts = [...prevAttempts, newAttempt];
      try {
        localStorage.setItem(STUDENT_ATTEMPTS_LOCALSTORAGE_KEY, JSON.stringify(updatedAttempts));
      } catch (error) {
        console.error("Failed to save student attempts to localStorage:", error);
        toast({ variant: "destructive", title: "Storage Error", description: "Could not save your attempt." });
      }
      return updatedAttempts;
    });
    // Toast for student submission is now in QuizDisplay
  }, [toast]);

  return (
    <StudyContext.Provider value={{ 
      currentUser, 
      loginUser, 
      logoutUser, 
      teacherQuizData, 
      setTeacherQuizData,
      clearTeacherQuizData,
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
