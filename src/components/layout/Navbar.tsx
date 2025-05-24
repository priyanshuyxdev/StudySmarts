
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, User, Briefcase, LogOut, BookOpenCheck, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AuthModal from '@/components/auth/AuthModal';
import { useStudyContext } from '@/context/StudyContext';
import { cn } from '@/lib/utils';

export default function Navbar() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authRole, setAuthRole] = useState<'student' | 'teacher'>('student');
  const { currentUser, logoutUser } = useStudyContext();
  const pathname = usePathname();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const initialTheme = storedTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
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
      logoutUser(); 
      setAuthRole(role);
      setIsAuthModalOpen(true);
    }
    // If already logged in as the correct role and trying to click the link,
    // Next.js Link component will handle navigation if it's a Link.
    // If it's a button for a role not yet logged into, it opens the modal.
  };

  const isHomeActive = pathname === '/';
  const isStudentActive = pathname === '/student';
  // Teacher is active on '/' if logged in as teacher
  const isTeacherActive = pathname === '/' && currentUser?.role === 'teacher';

  const baseNavButtonClasses = "transition-all duration-200 ease-in-out text-sm sm:text-base px-2 sm:px-3 rounded-none"; // rounded-none to prevent button's default rounding interfering with border
  const activeNavButtonClasses = "border-b-2 border-primary text-primary font-semibold";
  // Added hover:bg-transparent to ensure only underline effect
  const inactiveNavButtonHoverClasses = "text-foreground hover:bg-transparent hover:border-b-2 hover:border-primary/70 hover:text-primary/80";


  return (
    <>
      <nav className="bg-card shadow-md sticky top-0 z-50 border-b border-border/60">
        <div className="container mx-auto px-4 py-2.5 flex justify-between items-center">
          <Link href="/" className="flex items-center text-xl font-bold text-primary hover:text-primary/70 transition-colors duration-150 ease-in-out">
            <BookOpenCheck className="mr-2 h-7 w-7" />
            StudySmarts
          </Link>

          <div className="space-x-1 sm:space-x-2 flex items-center">
            <Link href="/" passHref>
              <Button 
                variant="ghost"
                className={cn(
                  baseNavButtonClasses,
                  isHomeActive && !isTeacherActive ? activeNavButtonClasses : inactiveNavButtonHoverClasses
                )}
              >
                <Home className="mr-1 h-4 w-4 sm:h-5 sm:w-5" /> Home
              </Button>
            </Link>
            
            {currentUser?.role === 'student' ? (
                 <Link href="/student" passHref>
                    <Button 
                      variant="ghost"
                      className={cn(
                        baseNavButtonClasses,
                        isStudentActive ? activeNavButtonClasses : inactiveNavButtonHoverClasses
                      )}
                    >
                        <User className="mr-1 h-4 w-4 sm:h-5 sm:w-5" /> Student
                    </Button>
                 </Link>
            ) : (
                <Button 
                  variant={"ghost"} 
                  onClick={() => handleAuthLinkClick('student')} 
                  className={cn(baseNavButtonClasses, inactiveNavButtonHoverClasses)}
                >
                    <User className="mr-1 h-4 w-4 sm:h-5 sm:w-5" /> Student
                </Button>
            )}

            {currentUser?.role === 'teacher' ? (
                 // Teacher link points to home, active state depends on being on home + teacher role
                 <Link href="/" passHref> 
                    <Button 
                      variant="ghost"
                      className={cn(
                        baseNavButtonClasses,
                        isTeacherActive ? activeNavButtonClasses : inactiveNavButtonHoverClasses
                      )}
                    >
                        <Briefcase className="mr-1 h-4 w-4 sm:h-5 sm:w-5" /> Teacher
                    </Button>
                 </Link>
            ) : (
                <Button 
                  variant={"ghost"} 
                  onClick={() => handleAuthLinkClick('teacher')} 
                  className={cn(baseNavButtonClasses, inactiveNavButtonHoverClasses)}
                >
                    <Briefcase className="mr-1 h-4 w-4 sm:h-5 sm:w-5" /> Teacher
                </Button>
            )}

            {currentUser && (
              <Button 
                variant="outline" 
                onClick={logoutUser} 
                size="sm" 
                className="flex items-center text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-1.5 hover:bg-destructive/10 hover:border-destructive hover:text-destructive transition-colors duration-150 ease-in-out rounded-md" // Added rounded-md back
              >
                <LogOut className="mr-1 h-3 w-3 sm:h-4 sm:w-4" /> Logout ({currentUser.id})
              </Button>
            )}
            <Button 
              onClick={toggleTheme} 
              variant="ghost" 
              size="icon" 
              className="ml-1 sm:ml-2 hover:bg-accent/50 transition-colors duration-150 ease-in-out rounded-full"
            >
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
