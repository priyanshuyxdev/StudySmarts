
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStudyContext } from '@/context/StudyContext';

interface AuthModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  roleToAuth: 'student' | 'teacher';
}

export default function AuthModal({ isOpen, setIsOpen, roleToAuth }: AuthModalProps) {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { loginUser } = useStudyContext();
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const success = loginUser(roleToAuth, id, password);
    if (success) {
      setIsOpen(false);
      setId('');
      setPassword('');
      if (roleToAuth === 'student') {
        router.push('/student');
      } else {
        router.push('/'); // Teacher uses home page
      }
    } else {
      setError("Invalid credentials. Please try again.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{roleToAuth === 'teacher' ? 'Teacher Login' : 'Student Login'}</DialogTitle>
          <DialogDescription>
            Enter your credentials to access the {roleToAuth} portal.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="id-input" className="text-right">
                ID
              </Label>
              <Input
                id="id-input"
                value={id}
                onChange={(e) => setId(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password-input" className="text-right">
                Password
              </Label>
              <Input
                id="password-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            {error && <p className="col-span-4 text-sm text-red-500 text-center">{error}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button type="submit">Login</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
