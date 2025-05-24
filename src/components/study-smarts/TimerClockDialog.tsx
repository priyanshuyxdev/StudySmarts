
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
    updateClock(); // Initial call
    const clockInterval = setInterval(updateClock, 1000);
    return () => clearInterval(clockInterval);
  }, []);

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
    setTimeLeft(null);
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
                   z-40 transition-all duration-300 ease-in-out transform hover:scale-110"
        aria-label="Open Timer and Clock"
      >
        <Timer className="h-7 w-7" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center text-xl">
              <Clock className="mr-2 h-6 w-6 text-primary" /> Timer & Clock
            </DialogTitle>
            <DialogDescription>
              Manage your study sessions effectively. Current time: <span className="font-semibold text-foreground">{currentTime}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-6">
            {/* Timer Display */}
            {timeLeft !== null && (
              <div className="text-center my-4">
                <p className="text-5xl font-bold tracking-tight text-primary">
                  {formatTimeLeft()}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isTimerRunning ? "Time Remaining" : "Timer Paused"}
                </p>
              </div>
            )}

            {/* Timer Setup */}
            {!isTimerRunning && timeLeft === null && (
              <div className="space-y-4">
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
                      className="w-20 text-center text-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      placeholder="MM"
                    />
                  </div>
                  <span className="text-2xl font-semibold text-muted-foreground">:</span>
                  <div>
                    <Label htmlFor="timer-seconds" className="sr-only">Seconds</Label>
                    <Input
                      id="timer-seconds"
                      type="number"
                      min="0"
                      max="59"
                      value={timerSeconds}
                      onChange={(e) => setTimerSeconds(e.target.value)}
                      className="w-20 text-center text-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      placeholder="SS"
                    />
                  </div>
                </div>
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
              {!isTimerRunning && (
                <Button onClick={handleSetAndStartTimer} className="w-full bg-green-500 hover:bg-green-600 text-white shadow-md hover:shadow-lg">
                  <Play className="mr-2 h-5 w-5" /> Set & Start Timer
                </Button>
              )}
              {isTimerRunning && (
                <Button onClick={handleStopTimer} variant="outline" className="w-full border-orange-500 text-orange-500 hover:bg-orange-500/10 shadow-sm hover:shadow">
                  <Square className="mr-2 h-5 w-5" /> Stop Timer
                </Button>
              )}
               <Button onClick={handleResetTimer} variant="outline" className="w-full shadow-sm hover:shadow">
                  <RotateCcw className="mr-2 h-5 w-5" /> Reset Timer
                </Button>
            </div>
             <p className="text-xs text-muted-foreground text-center mt-4">
                StudySmarts will try to show a desktop notification when the timer ends.
             </p>
          </div>

          <DialogFooter className="mt-6 sm:justify-start">
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
