
"use client";

import type { GenerateFlashcardsOutput } from "@/ai/flows/generate-flashcards";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Repeat, Layers } from "lucide-react";
import { useState, useEffect } from "react";

interface FlashcardViewerProps {
  flashcards: GenerateFlashcardsOutput['flashcards'];
  isLoading: boolean;
}

export default function FlashcardViewer({ flashcards, isLoading }: FlashcardViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [flashcards]);

  if (isLoading) {
    return (
      <Card className="shadow-lg mt-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Layers className="mr-2 h-6 w-6 text-primary" />
            Flashcards Loading...
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <div className="h-40 flex items-center justify-center">
             <Layers className="h-12 w-12 animate-pulse text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!flashcards || flashcards.length === 0) {
    return null;
  }

  const currentCard = flashcards[currentIndex];

  const handleNext = () => {
    setIsFlipped(false); 
    setCurrentIndex((prevIndex) => (prevIndex + 1) % flashcards.length);
  };

  const handlePrev = () => {
    setIsFlipped(false); 
    setCurrentIndex((prevIndex) => (prevIndex - 1 + flashcards.length) % flashcards.length);
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <Card className="shadow-lg mt-6">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Layers className="mr-2 h-6 w-6 text-primary" />
          Flashcards
        </CardTitle>
        <CardDescription>
          Review key terms and concepts. Click card to flip. ({currentIndex + 1} of {flashcards.length})
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-4">
        <div
          onClick={handleFlip}
          className="w-full max-w-md h-64 border bg-card rounded-lg p-6 flex items-center justify-center text-center cursor-pointer shadow-md hover:shadow-xl transition-shadow duration-200 relative overflow-hidden"
          style={{ perspective: '1000px' }}
        >
          <div 
            className="transition-transform duration-500 ease-in-out w-full h-full flex items-center justify-center"
            style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
          >
            <div className="absolute w-full h-full p-4 flex items-center justify-center" style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>
              <p className="text-xl font-semibold">{currentCard.term}</p>
            </div>
            <div className="absolute w-full h-full p-4 flex items-center justify-center bg-card" style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
              <p className="text-sm">{currentCard.definition}</p>
            </div>
          </div>
        </div>
        <div className="flex w-full max-w-md justify-between items-center">
          <Button onClick={handlePrev} variant="outline" size="icon" aria-label="Previous flashcard" className="shadow-sm hover:shadow transition-shadow">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button onClick={handleFlip} variant="outline" aria-label="Flip flashcard" className="shadow-sm hover:shadow transition-shadow">
            <Repeat className="mr-2 h-4 w-4" /> Flip Card
          </Button>
          <Button onClick={handleNext} variant="outline" size="icon" aria-label="Next flashcard" className="shadow-sm hover:shadow transition-shadow">
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
