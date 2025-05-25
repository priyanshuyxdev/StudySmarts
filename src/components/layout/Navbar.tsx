
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
  };

  const isHomeActive = pathname === '/';
  const isStudentActive = pathname === '/student';
  // Teacher is active on '/' if logged in as teacher AND not also on student page
  const isTeacherActive = pathname === '/' && currentUser?.role === 'teacher' && !isStudentActive;


  const baseNavButtonClasses = "transition-all duration-200 ease-in-out text-xs sm:text-sm px-2 py-1 sm:px-3 rounded-none";
  const activeNavButtonClasses = "border-b-2 border-primary text-primary font-semibold";
  const inactiveNavButtonHoverClasses = "text-foreground hover:bg-transparent hover:border-b-2 hover:border-primary/70 hover:text-primary/80";


  return (
    <>
      <nav className="bg-card shadow-md sticky top-0 z-40 border-b border-border/60"> {/* Changed z-50 to z-40 */}
        <div className="container mx-auto px-2 sm:px-4 py-2.5 flex justify-between items-center"> {/* Reduced px-4 to px-2 for small screens */}
          <Link href="/" className="flex items-center text-lg sm:text-xl font-bold text-primary hover:text-primary/70 transition-colors duration-150 ease-in-out">
            <BookOpenCheck className="mr-1.5 h-6 w-6 sm:h-7 sm:w-7" /> {/* Adjusted icon margin */}
            StudySmarts
          </Link>

          <div className="flex items-center space-x-0.5 sm:space-x-1"> {/* Reduced space for smaller screens */}
            <Link href="/" passHref>
              <Button 
                variant="ghost"
                className={cn(
                  baseNavButtonClasses,
                  isHomeActive && !isTeacherActive && !isStudentActive ? activeNavButtonClasses : inactiveNavButtonHoverClasses
                )}
              >
                <Home className="mr-1 h-4 w-4" /> Home
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
                        <User className="mr-1 h-4 w-4" /> Student
                    </Button>
                 </Link>
            ) : (
                <Button 
                  variant={"ghost"} 
                  onClick={() => handleAuthLinkClick('student')} 
                  className={cn(baseNavButtonClasses, inactiveNavButtonHoverClasses, isStudentActive ? activeNavButtonClasses : "")}
                >
                    <User className="mr-1 h-4 w-4" /> Student
                </Button>
            )}

            {currentUser?.role === 'teacher' ? (
                 <Link href="/" passHref> 
                    <Button 
                      variant="ghost"
                      className={cn(
                        baseNavButtonClasses,
                        isTeacherActive ? activeNavButtonClasses : inactiveNavButtonHoverClasses
                      )}
                    >
                        <Briefcase className="mr-1 h-4 w-4" /> Teacher
                    </Button>
                 </Link>
            ) : (
                <Button 
                  variant={"ghost"} 
                  onClick={() => handleAuthLinkClick('teacher')} 
                  className={cn(baseNavButtonClasses, inactiveNavButtonHoverClasses, isTeacherActive ? activeNavButtonClasses : "")}
                >
                    <Briefcase className="mr-1 h-4 w-4" /> Teacher
                </Button>
            )}

            <div className="flex items-center space-x-1 sm:space-x-2 ml-1 sm:ml-2"> {/* Reduced space */}
              {currentUser && (
                <Button 
                  variant="outline" 
                  onClick={logoutUser} 
                  size="sm" 
                  className="flex items-center text-xs px-1.5 py-1 sm:px-3 sm:py-1.5 hover:bg-destructive/10 hover:border-destructive hover:text-destructive transition-colors duration-150 ease-in-out rounded-md"
                >
                  <LogOut className="mr-1 h-3 w-3" /> <span className="hidden sm:inline">Logout ({currentUser.id})</span> <span className="sm:hidden">Logout</span>
                </Button>
              )}
              <Button 
                onClick={toggleTheme} 
                variant="ghost" 
                size="icon" 
                className="hover:bg-accent/50 transition-colors duration-150 ease-in-out rounded-full w-8 h-8 sm:w-auto sm:h-auto" /* Adjusted size for small */
              >
                {theme === 'light' ? <Moon className="h-4 w-4 sm:h-5 sm:w-5" /> : <Sun className="h-4 w-4 sm:h-5 sm:w-5" />}
                <span className="sr-only">Toggle theme</span>
              </Button>
            </div>
          </div>
        </div>
      </nav>
      <AuthModal isOpen={isAuthModalOpen} setIsOpen={setIsAuthModalOpen} roleToAuth={authRole} />
    </>
  );
}
