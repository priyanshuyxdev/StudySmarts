
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, User, Briefcase, LogOut, BookOpenCheck, Sun, Moon, Menu as MenuIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AuthModal from '@/components/auth/AuthModal';
import { useStudyContext } from '@/context/StudyContext';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose, // Ensure SheetClose is imported
} from "@/components/ui/sheet";

export default function Navbar() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authRole, setAuthRole] = useState<'student' | 'teacher'>('student');
  const { currentUser, logoutUser } = useStudyContext();
  const pathname = usePathname();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const initialTheme = storedTheme || (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
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
      logoutUser(); // Logout if switching roles via auth modal
      setAuthRole(role);
      setIsAuthModalOpen(true);
    }
    setIsMobileMenuOpen(false); // Close mobile menu when auth modal is triggered
  };
  
  const handleLogout = () => {
    logoutUser();
    setIsMobileMenuOpen(false); // Close mobile menu on logout
  }

  const isHomeActive = pathname === '/';
  const isStudentActive = pathname === '/student';
  // Teacher is active on '/' if logged in as teacher AND not on student page
  const isTeacherActive = pathname === '/' && currentUser?.role === 'teacher' && !isStudentActive;


  const baseNavButtonClasses = "transition-all duration-200 ease-in-out text-sm px-3 py-2 md:px-2 md:py-1.5 lg:px-3 lg:py-2 rounded-none";
  const activeNavButtonClasses = "border-b-2 border-primary text-primary font-semibold";
  const inactiveNavButtonHoverClasses = "text-foreground hover:bg-transparent hover:border-b-2 hover:border-primary/70 hover:text-primary/80";
  
  const mobileLinkClasses = "flex items-center w-full text-left p-3 rounded-md hover:bg-accent text-base";
  const mobileActiveLinkClasses = "bg-accent text-accent-foreground font-semibold";

  // Desktop Navigation Links Component
  const DesktopNavLinks = () => (
    <>
      <Link href="/" passHref>
        <Button
          variant="ghost"
          className={cn(
            baseNavButtonClasses,
            isHomeActive && !isTeacherActive && !isStudentActive ? activeNavButtonClasses : inactiveNavButtonHoverClasses
          )}
        >
          <Home className="mr-0.5 md:mr-1 h-3.5 w-3.5 md:h-4 md:w-4" />
          <span className="hidden xxs:inline">Home</span>
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
            <User className="mr-0.5 md:mr-1 h-3.5 w-3.5 md:h-4 md:w-4" />
            <span className="hidden xxs:inline">Student</span>
          </Button>
        </Link>
      ) : (
        <Button
          variant={"ghost"}
          onClick={() => handleAuthLinkClick('student')}
          className={cn(baseNavButtonClasses, inactiveNavButtonHoverClasses, isStudentActive ? activeNavButtonClasses : "")}
        >
          <User className="mr-0.5 md:mr-1 h-3.5 w-3.5 md:h-4 md:w-4" />
          <span className="hidden xxs:inline">Student</span>
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
            <Briefcase className="mr-0.5 md:mr-1 h-3.5 w-3.5 md:h-4 md:w-4" />
            <span className="hidden xxs:inline">Teacher</span>
          </Button>
        </Link>
      ) : (
        <Button
          variant={"ghost"}
          onClick={() => handleAuthLinkClick('teacher')}
          className={cn(baseNavButtonClasses, inactiveNavButtonHoverClasses, isTeacherActive ? activeNavButtonClasses : "")}
        >
          <Briefcase className="mr-0.5 md:mr-1 h-3.5 w-3.5 md:h-4 md:w-4" />
          <span className="hidden xxs:inline">Teacher</span>
        </Button>
      )}
    </>
  );

  return (
    <>
      <nav className="bg-card shadow-md sticky top-0 z-40 border-b border-border/60">
        <div className="container mx-auto px-2 sm:px-4 py-2 flex justify-between items-center">
          <Link href="/" className="flex items-center text-lg md:text-xl font-bold text-primary hover:text-primary/70 transition-colors duration-150 ease-in-out">
            <BookOpenCheck className="mr-1 md:mr-2 h-6 w-6 md:h-7 md:w-7" />
            <span className="hidden xxs:inline">StudySmarts</span>
            <span className="xxs:hidden">SS</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-0.5 lg:space-x-1">
            <DesktopNavLinks />
            <div className="flex items-center space-x-1 ml-1 md:ml-2">
              {currentUser && (
                <Button
                  variant="outline"
                  onClick={handleLogout} // handleLogout already calls setIsMobileMenuOpen(false)
                  size="sm"
                  className="flex items-center px-2 py-1 md:px-3 md:py-1.5 hover:bg-destructive/10 hover:border-destructive hover:text-destructive transition-colors duration-150 ease-in-out rounded-md text-xs md:text-sm"
                >
                  <LogOut className="mr-1 h-3.5 w-3.5 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">Logout ({currentUser.id})</span>
                  <span className="sm:hidden">Logout</span>
                </Button>
              )}
              <Button
                onClick={toggleTheme}
                variant="ghost"
                size="icon"
                className="hover:bg-accent/50 transition-colors duration-150 ease-in-out rounded-full w-7 h-7 md:w-8 md:h-8"
              >
                {theme === 'light' ? <Moon className="h-3.5 w-3.5 md:h-4 md:w-4" /> : <Sun className="h-3.5 w-3.5 md:h-4 md:w-4" />}
                <span className="sr-only">Toggle theme</span>
              </Button>
            </div>
          </div>

          {/* Mobile Menu Trigger */}
          <div className="md:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MenuIcon className="h-6 w-6" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-[320px] p-0">
                <SheetHeader className="p-4 border-b">
                  <SheetTitle className="flex items-center text-lg">
                    <BookOpenCheck className="mr-2 h-6 w-6 text-primary" /> Menu
                  </SheetTitle>
                </SheetHeader>
                <div className="p-4 space-y-2">
                  {/* Home Link */}
                  <SheetClose asChild>
                    <Link href="/" passHref>
                      <Button
                        variant="ghost"
                        className={cn(mobileLinkClasses, isHomeActive && !isTeacherActive && !isStudentActive ? mobileActiveLinkClasses : "hover:bg-muted")}
                      >
                        <Home className="mr-2 h-4 w-4" /> Home
                      </Button>
                    </Link>
                  </SheetClose>

                  {/* Student Link/Button */}
                  {currentUser?.role === 'student' ? (
                    <SheetClose asChild>
                      <Link href="/student" passHref>
                        <Button
                          variant="ghost"
                          className={cn(mobileLinkClasses, isStudentActive ? mobileActiveLinkClasses : "hover:bg-muted")}
                        >
                          <User className="mr-2 h-4 w-4" /> Student
                        </Button>
                      </Link>
                    </SheetClose>
                  ) : (
                    // Button to trigger AuthModal, handleAuthLinkClick closes sheet
                    <Button
                      variant={"ghost"}
                      onClick={() => handleAuthLinkClick('student')}
                      className={cn(mobileLinkClasses, "hover:bg-muted", isStudentActive ? mobileActiveLinkClasses : "")}
                    >
                      <User className="mr-2 h-4 w-4" /> Student
                    </Button>
                  )}

                  {/* Teacher Link/Button */}
                  {currentUser?.role === 'teacher' ? (
                    <SheetClose asChild>
                      <Link href="/" passHref>
                        <Button
                          variant="ghost"
                          className={cn(mobileLinkClasses, isTeacherActive ? mobileActiveLinkClasses : "hover:bg-muted")}
                        >
                          <Briefcase className="mr-2 h-4 w-4" /> Teacher
                        </Button>
                      </Link>
                    </SheetClose>
                  ) : (
                     // Button to trigger AuthModal, handleAuthLinkClick closes sheet
                    <Button
                      variant={"ghost"}
                      onClick={() => handleAuthLinkClick('teacher')}
                      className={cn(mobileLinkClasses, "hover:bg-muted", isTeacherActive ? mobileActiveLinkClasses : "")}
                    >
                      <Briefcase className="mr-2 h-4 w-4" /> Teacher
                    </Button>
                  )}
                  
                  <hr className="my-3 border-border" />

                  {currentUser && (
                     // Logout button, handleLogout closes sheet
                    <Button
                      variant="outline"
                      onClick={handleLogout}
                      className="w-full flex items-center justify-start p-3 rounded-md hover:bg-destructive/10 hover:border-destructive hover:text-destructive"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout ({currentUser.id})
                    </Button>
                  )}
                  {/* Theme toggle button */}
                  <SheetClose asChild>
                    <Button
                      onClick={toggleTheme} // toggleTheme itself doesn't close, so SheetClose handles it
                      variant="ghost"
                      className="w-full flex items-center justify-start p-3 rounded-md hover:bg-accent"
                    >
                      {theme === 'light' ? <Moon className="mr-2 h-4 w-4" /> : <Sun className="mr-2 h-4 w-4" />}
                      Toggle Theme ({theme === 'light' ? 'Dark' : 'Light'})
                    </Button>
                  </SheetClose>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>
      <AuthModal isOpen={isAuthModalOpen} setIsOpen={setIsAuthModalOpen} roleToAuth={authRole} />
    </>
  );
}


    