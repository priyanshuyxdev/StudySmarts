
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation'; // Import usePathname
import { Home, User, Briefcase, LogOut, BookOpenCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AuthModal from '@/components/auth/AuthModal';
import { useStudyContext } from '@/context/StudyContext';

export default function Navbar() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authRole, setAuthRole] = useState<'student' | 'teacher'>('student');
  const { currentUser, logoutUser } = useStudyContext();
  const pathname = usePathname(); // Get current pathname

  const handleAuthLinkClick = (role: 'student' | 'teacher') => {
    if (!currentUser) {
      setAuthRole(role);
      setIsAuthModalOpen(true);
    } else if (currentUser.role !== role) {
      logoutUser();
      setAuthRole(role);
      setIsAuthModalOpen(true);
    }
    // If already logged in as this role, specific navigation handled by Link href or current page
  };

  const isHomeActive = pathname === '/';
  const isStudentActive = pathname === '/student';
  // Teacher's main page is '/', so "Teacher" link is active if they are a teacher and on the home page.
  const isTeacherActive = pathname === '/' && currentUser?.role === 'teacher';


  return (
    <>
      <nav className="bg-card shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/" className="flex items-center text-xl font-bold text-primary hover:text-primary/80">
            <BookOpenCheck className="mr-2 h-7 w-7" />
            StudySmarts
          </Link>

          <div className="space-x-2 sm:space-x-4 flex items-center">
            <Link href="/" passHref>
              <Button variant={isHomeActive && !isTeacherActive ? "secondary" : "ghost"} className="flex items-center text-sm sm:text-base">
                <Home className="mr-1 h-4 w-4 sm:h-5 sm:w-5" /> Home
              </Button>
            </Link>
            
            {currentUser?.role === 'student' ? (
                 <Link href="/student" passHref>
                    <Button variant={isStudentActive ? "secondary" : "ghost"} className="flex items-center text-sm sm:text-base">
                        <User className="mr-1 h-4 w-4 sm:h-5 sm:w-5" /> Student
                    </Button>
                 </Link>
            ) : (
                <Button variant={isStudentActive ? "secondary" : "ghost"} onClick={() => handleAuthLinkClick('student')} className="flex items-center text-sm sm:text-base">
                    <User className="mr-1 h-4 w-4 sm:h-5 sm:w-5" /> Student
                </Button>
            )}

            {currentUser?.role === 'teacher' ? (
                 <Link href="/" passHref> {/* Teacher uses home page for creation */}
                    <Button variant={isTeacherActive ? "secondary" : "ghost"} className="flex items-center text-sm sm:text-base">
                        <Briefcase className="mr-1 h-4 w-4 sm:h-5 sm:w-5" /> Teacher
                    </Button>
                 </Link>
            ) : (
                <Button variant={isTeacherActive ? "secondary" : "ghost"} onClick={() => handleAuthLinkClick('teacher')} className="flex items-center text-sm sm:text-base">
                    <Briefcase className="mr-1 h-4 w-4 sm:h-5 sm:w-5" /> Teacher
                </Button>
            )}

            {currentUser && (
              <Button variant="outline" onClick={logoutUser} size="sm" className="flex items-center">
                <LogOut className="mr-1 h-4 w-4" /> Logout ({currentUser.id})
              </Button>
            )}
          </div>
        </div>
      </nav>
      <AuthModal isOpen={isAuthModalOpen} setIsOpen={setIsAuthModalOpen} roleToAuth={authRole} />
    </>
  );
}
