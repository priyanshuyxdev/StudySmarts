
"use client";

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { SummarizeDocumentOutput } from '@/ai/flows/summarize-document';
import type { GenerateQuizOutput } from '@/ai/flows/generate-quiz';
import { useToast } from "@/hooks/use-toast";

const TEACHER_QUIZ_DATA_LOCALSTORAGE_KEY = "teacherQuizData";
const STUDENT_ATTEMPTS_LOCALSTORAGE_KEY = "studentAttempts"; // For potential future use

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
  clearTeacherQuizData: () => void;
  recordStudentAttempt: (attempt: Omit<StudentAttempt, 'timestamp'>) => void;
}

const TEACHER_ID = "vikas";
const TEACHER_PASSWORD = "vikas123";

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
    // Load teacher quiz data from localStorage on initial mount
    try {
      const storedTeacherQuizData = localStorage.getItem(TEACHER_QUIZ_DATA_LOCALSTORAGE_KEY);
      if (storedTeacherQuizData) {
        setTeacherQuizDataState(JSON.parse(storedTeacherQuizData));
      }
    } catch (error) {
      console.error("Failed to load teacher quiz data from localStorage:", error);
      localStorage.removeItem(TEACHER_QUIZ_DATA_LOCALSTORAGE_KEY); // Clear corrupted data
    }

    // Potential: Load student attempts from localStorage if needed for persistence
    // try {
    //   const storedStudentAttempts = localStorage.getItem(STUDENT_ATTEMPTS_LOCALSTORAGE_KEY);
    //   if (storedStudentAttempts) {
    //     setStudentAttempts(JSON.parse(storedStudentAttempts));
    //   }
    // } catch (error) {
    //   console.error("Failed to load student attempts from localStorage:", error);
    //   localStorage.removeItem(STUDENT_ATTEMPTS_LOCALSTORAGE_KEY);
    // }
  }, []);


  const loginUser = useCallback((role: 'student' | 'teacher', idInput: string, passwordInput: string): boolean => {
    if (role === 'teacher') {
      if (idInput.toLowerCase() === TEACHER_ID.toLowerCase() && passwordInput === TEACHER_PASSWORD) {
        setCurrentUser({ role: 'teacher', id: TEACHER_ID });
        toast({ title: "Login Successful", description: "Welcome, Teacher!" });
        return true;
      }
    } else if (role === 'student') {
      const matchedStudent = studentCredentials.find(
        student => student.id.toLowerCase() === idInput.toLowerCase() && student.password === passwordInput
      );
      if (matchedStudent) {
        setCurrentUser({ role: 'student', id: matchedStudent.id });
        toast({ title: "Login Successful", description: `Welcome, ${matchedStudent.id}!` });
        return true;
      }
    }
    toast({ variant: "destructive", title: "Login Failed", description: "Invalid ID or password." });
    return false;
  }, [toast]);

  const logoutUser = useCallback(() => {
    setCurrentUser(null);
    // Note: We don't clear teacherQuizData on logout, teacher might log back in to the same session.
    // Student attempts also persist in memory for the session.
    toast({ title: "Logged Out", description: "You have been successfully logged out." });
  }, [toast]);

  const setTeacherQuizData = useCallback((data: TeacherQuizData) => {
    setTeacherQuizDataState(data);
    try {
      localStorage.setItem(TEACHER_QUIZ_DATA_LOCALSTORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error("Failed to save teacher quiz data to localStorage:", error);
      toast({ variant: "destructive", title: "Storage Error", description: "Could not save quiz data."});
    }
    toast({ title: "Quiz Set for Students", description: `Quiz "${data.documentName}" is now active.` });
  }, [toast]);

  const clearTeacherQuizData = useCallback(() => {
    setTeacherQuizDataState(null);
    try {
      localStorage.removeItem(TEACHER_QUIZ_DATA_LOCALSTORAGE_KEY);
    } catch (error) {
      console.error("Failed to remove teacher quiz data from localStorage:", error);
    }
    // Student attempts are not cleared here, they are only filtered in the UI
    // based on the currently active teacherQuizData.
    toast({ title: "Active Quiz Cleared", description: "No quiz is currently active for students." });
  }, [toast]);


  const recordStudentAttempt = useCallback((attempt: Omit<StudentAttempt, 'timestamp'>) => {
    setStudentAttempts(prevAttempts => {
      const newAttempt = { ...attempt, timestamp: Date.now() };
      const updatedAttempts = [...prevAttempts, newAttempt];
      // Potential: Save student attempts to localStorage if needed for persistence
      // try {
      //   localStorage.setItem(STUDENT_ATTEMPTS_LOCALSTORAGE_KEY, JSON.stringify(updatedAttempts));
      // } catch (error) {
      //   console.error("Failed to save student attempts to localStorage:", error);
      // }
      return updatedAttempts;
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
