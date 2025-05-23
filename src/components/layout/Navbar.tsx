
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, User, Briefcase, LogOut, BookOpenCheck, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AuthModal from '@/components/auth/AuthModal';
import { useStudyContext } from '@/context/StudyContext';

export default function Navbar() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authRole, setAuthRole] = useState<'student' | 'teacher'>('student');
  const { currentUser, logoutUser } = useStudyContext();
  const pathname = usePathname();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const initialTheme = storedTheme || 'light';
    setTheme(initialTheme);
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    setTheme(prevTheme => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', newTheme);
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return newTheme;
    });
  };

  const handleAuthLinkClick = (role: 'student' | 'teacher') => {
    if (!currentUser) {
      setAuthRole(role);
      setIsAuthModalOpen(true);
    } else if (currentUser.role !== role) {
      logoutUser(); // Log out if switching roles needing auth
      setAuthRole(role);
      setIsAuthModalOpen(true);
    }
    // If already logged in as this role, specific navigation handled by Link href or current page
  };

  const isHomeActive = pathname === '/';
  const isStudentActive = pathname === '/student';
  const isTeacherActive = pathname === '/' && currentUser?.role === 'teacher';


  return (
    <>
      <nav className="bg-card shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/" className="flex items-center text-xl font-bold text-primary hover:text-primary/80">
            <BookOpenCheck className="mr-2 h-7 w-7" />
            StudySmarts
          </Link>

          <div className="space-x-1 sm:space-x-2 flex items-center">
            <Link href="/" passHref>
              <Button variant={isHomeActive && !(isTeacherActive && currentUser?.role === 'teacher') ? "secondary" : "ghost"} className="flex items-center text-sm sm:text-base px-2 sm:px-3">
                <Home className="mr-1 h-4 w-4 sm:h-5 sm:w-5" /> Home
              </Button>
            </Link>
            
            {currentUser?.role === 'student' ? (
                 <Link href="/student" passHref>
                    <Button variant={isStudentActive ? "secondary" : "ghost"} className="flex items-center text-sm sm:text-base px-2 sm:px-3">
                        <User className="mr-1 h-4 w-4 sm:h-5 sm:w-5" /> Student
                    </Button>
                 </Link>
            ) : (
                <Button variant={isStudentActive ? "secondary" : "ghost"} onClick={() => handleAuthLinkClick('student')} className="flex items-center text-sm sm:text-base px-2 sm:px-3">
                    <User className="mr-1 h-4 w-4 sm:h-5 sm:w-5" /> Student
                </Button>
            )}

            {currentUser?.role === 'teacher' ? (
                 <Link href="/" passHref> 
                    <Button variant={isTeacherActive ? "secondary" : "ghost"} className="flex items-center text-sm sm:text-base px-2 sm:px-3">
                        <Briefcase className="mr-1 h-4 w-4 sm:h-5 sm:w-5" /> Teacher
                    </Button>
                 </Link>
            ) : (
                <Button variant={isTeacherActive ? "secondary" : "ghost"} onClick={() => handleAuthLinkClick('teacher')} className="flex items-center text-sm sm:text-base px-2 sm:px-3">
                    <Briefcase className="mr-1 h-4 w-4 sm:h-5 sm:w-5" /> Teacher
                </Button>
            )}

            {currentUser && (
              <Button variant="outline" onClick={logoutUser} size="sm" className="flex items-center text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-1.5">
                <LogOut className="mr-1 h-3 w-3 sm:h-4 sm:w-4" /> Logout ({currentUser.id})
              </Button>
            )}
            <Button onClick={toggleTheme} variant="ghost" size="icon" className="ml-1 sm:ml-2">
              {theme === 'light' ? <Moon className="h-5 w-5 sm:h-6 sm:w-6" /> : <Sun className="h-5 w-5 sm:h-6 sm:w-6" />}
              <span className="sr-only">Toggle theme</span>
            </Button>
          </div>
        </div>
      </nav>
      <AuthModal isOpen={isAuthModalOpen} setIsOpen={setIsAuthModalOpen} roleToAuth={authRole} />
    </>
  );
}
