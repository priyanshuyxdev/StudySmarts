
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogClose
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Timer, Clock, BellRing, Play, Square, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function TimerClockDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  
  const [timerMinutes, setTimerMinutes] = useState<string>('10');
  const [timerSeconds, setTimerSeconds] = useState<string>('00');
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const updateClock = () => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    if (isOpen) { // Only update clock if dialog is open to save resources
        updateClock(); // Initial call
        const clockInterval = setInterval(updateClock, 1000);
        return () => clearInterval(clockInterval);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isTimerRunning && timeLeft !== null && timeLeft > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimeLeft(prevTime => (prevTime !== null ? prevTime - 1 : null));
      }, 1000);
    } else if (timeLeft === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      handleTimerEnd();
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isTimerRunning, timeLeft]);

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      toast({ variant: "destructive", title: "Notifications not supported", description: "Your browser does not support desktop notifications." });
      return false;
    }
    if (Notification.permission === 'granted') {
      return true;
    }
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  };

  const showNotification = (title: string, body: string) => {
    if (Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.ico' }); // Assuming you might have a favicon
    }
    toast({ title, description: body, duration: 10000 });
  };
  
  const handleTimerEnd = () => {
    showNotification("StudySmarts Timer", "Time's up! Your study session has ended.");
    setTimeLeft(null); // Or set to 0 if you want it to stay at 00:00
  };

  const handleSetAndStartTimer = async () => {
    const minutes = parseInt(timerMinutes, 10) || 0;
    const seconds = parseInt(timerSeconds, 10) || 0;
    const totalSeconds = minutes * 60 + seconds;

    if (totalSeconds <= 0) {
      toast({ variant: "destructive", title: "Invalid Time", description: "Please set a valid timer duration." });
      return;
    }

    const permissionGranted = await requestNotificationPermission();
    // We proceed even if permission is not granted, toast will still work.

    setTimeLeft(totalSeconds);
    setIsTimerRunning(true);
    toast({ title: "Timer Started!", description: `Timer set for ${minutes}m ${seconds}s.`});
  };

  const handleStopTimer = () => {
    setIsTimerRunning(false);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    // Keep timeLeft to show where it stopped, or reset:
    // setTimeLeft(null); 
    toast({ title: "Timer Stopped"});
  };

  const handleResetTimer = () => {
    setIsTimerRunning(false);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setTimeLeft(null);
    setTimerMinutes('10');
    setTimerSeconds('00');
    toast({ title: "Timer Reset"});
  };

  const formatTimeLeft = () => {
    if (timeLeft === null) return "00:00";
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        size="icon"
        className="fixed bottom-[5.5rem] right-6 h-14 w-14 rounded-full shadow-lg 
                   bg-gradient-to-br from-cyan-500 to-blue-600 text-white
                   hover:from-cyan-600 hover:to-blue-700 
                   focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 
                   shadow-blue-500/50 dark:shadow-lg dark:shadow-blue-800/80 
                   z-48 transition-all duration-300 ease-in-out transform hover:scale-110" // Changed z-40 to z-48
        aria-label="Open Timer and Clock"
      >
        <Timer className="h-7 w-7" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center text-lg sm:text-xl">
              <Clock className="mr-2 h-5 w-5 sm:h-6 sm:w-6 text-primary" /> Timer &amp; Clock
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Manage your study sessions effectively.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4 sm:space-y-6">
            {/* Prominent Clock Display */}
            <div className="text-center">
                <p className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                    {currentTime || "Loading..."}
                </p>
                <p className="text-xs text-muted-foreground">Current Time</p>
            </div>


            {/* Timer Display */}
            {timeLeft !== null && (
              <div className="text-center my-3 sm:my-4">
                <p className="text-4xl sm:text-5xl font-bold tracking-tight text-primary">
                  {formatTimeLeft()}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {isTimerRunning ? "Time Remaining" : "Timer Paused"}
                </p>
              </div>
            )}

            {/* Timer Setup */}
            {!isTimerRunning && timeLeft === null && (
              <div className="space-y-3 sm:space-y-4">
                <p className="text-sm font-medium text-center">Set a new timer:</p>
                <div className="flex items-center justify-center space-x-2">
                  <div>
                    <Label htmlFor="timer-minutes" className="sr-only">Minutes</Label>
                    <Input
                      id="timer-minutes"
                      type="number"
                      min="0"
                      max="120"
                      value={timerMinutes}
                      onChange={(e) => setTimerMinutes(e.target.value)}
                      className="w-16 sm:w-20 text-center text-base sm:text-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      placeholder="MM"
                    />
                  </div>
                  <span className="text-xl sm:text-2xl font-semibold text-muted-foreground">:</span>
                  <div>
                    <Label htmlFor="timer-seconds" className="sr-only">Seconds</Label>
                    <Input
                      id="timer-seconds"
                      type="number"
                      min="0"
                      max="59"
                      value={timerSeconds}
                      onChange={(e) => setTimerSeconds(e.target.value)}
                      className="w-16 sm:w-20 text-center text-base sm:text-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      placeholder="SS"
                    />
                  </div>
                </div>
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mt-4 sm:mt-6">
              {!isTimerRunning && (
                <Button onClick={handleSetAndStartTimer} className="w-full bg-green-500 hover:bg-green-600 text-white shadow-md hover:shadow-lg text-sm sm:text-base py-2 sm:py-2.5">
                  <Play className="mr-1.5 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" /> Set &amp; Start Timer
                </Button>
              )}
              {isTimerRunning && (
                <Button onClick={handleStopTimer} variant="outline" className="w-full border-orange-500 text-orange-500 hover:bg-orange-500/10 shadow-sm hover:shadow text-sm sm:text-base py-2 sm:py-2.5">
                  <Square className="mr-1.5 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" /> Stop Timer
                </Button>
              )}
               <Button onClick={handleResetTimer} variant="outline" className="w-full shadow-sm hover:shadow text-sm sm:text-base py-2 sm:py-2.5">
                  <RotateCcw className="mr-1.5 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" /> Reset Timer
                </Button>
            </div>
             <p className="text-xs text-muted-foreground text-center mt-3 sm:mt-4">
                StudySmarts will try to show a desktop notification when the timer ends.
             </p>
          </div>

          <DialogFooter className="mt-4 sm:mt-6 sm:justify-start">
            <DialogClose asChild>
              <Button type="button" variant="ghost" size="sm" className="text-xs sm:text-sm">
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
