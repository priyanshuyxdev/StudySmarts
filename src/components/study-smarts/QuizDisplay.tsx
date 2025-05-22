
"use client";

import type { GenerateQuizOutput } from "@/ai/flows/generate-quiz";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { HelpCircle, Edit3, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface QuizDisplayProps {
  quiz: GenerateQuizOutput;
  onQuizChange: (newQuiz: GenerateQuizOutput) => void;
  isLoading: boolean;
}

export default function QuizDisplay({ quiz, onQuizChange, isLoading }: QuizDisplayProps) {
  const [userSelections, setUserSelections] = useState<{[key: number]: string | undefined}>({});
  const [feedback, setFeedback] = useState<{[key: number]: 'correct' | 'incorrect' | undefined}>({});

  // Reset local state if quiz prop changes (e.g., new quiz generated)
  useEffect(() => {
    setUserSelections({});
    setFeedback({});
  }, [quiz]);

  const handleQuestionTextChange = (index: number, value: string) => {
    const updatedQuestions = quiz.questions.map((q, i) => {
      if (i === index) {
        return { ...q, question: value };
      }
      return q;
    });
    onQuizChange({ questions: updatedQuestions });
  };

  const handleOptionTextChange = (qIndex: number, oIndex: number, value: string) => {
    const oldOptionText = quiz.questions[qIndex].options[oIndex];
    const updatedQuestions = quiz.questions.map((q, i) => {
      if (i === qIndex) {
        const updatedOptions = q.options.map((opt, optIdx) => (optIdx === oIndex ? value : opt));
        // If the edited option was the answer, update the answer text as well
        const newAnswer = q.answer === oldOptionText ? value : q.answer;
        return { ...q, options: updatedOptions, answer: newAnswer };
      }
      return q;
    });
    onQuizChange({ questions: updatedQuestions });

    // If this option was selected by the user, re-evaluate feedback
    if (userSelections[qIndex] === oldOptionText) {
        // Temporarily update user selection to the new text to re-trigger feedback
        handleUserSelection(qIndex, value);
    } else if (quiz.questions[qIndex].answer === oldOptionText && userSelections[qIndex] !== undefined) {
        // If the *correct answer* was this option and user had selected something else,
        // their feedback might change based on the new text of the correct answer
        handleUserSelection(qIndex, userSelections[qIndex]!);
    }


  };
  
  const handleCorrectAnswerTextChange = (qIndex: number, newAnswerText: string) => {
    const updatedQuestions = quiz.questions.map((q, i) => {
      if (i === qIndex) {
        return { ...q, answer: newAnswerText };
      }
      return q;
    });
    onQuizChange({ questions: updatedQuestions });

    // Re-evaluate feedback for this question if a user selection exists
    if (userSelections[qIndex] !== undefined) {
      if (newAnswerText === userSelections[qIndex]) {
        setFeedback(prev => ({...prev, [qIndex]: 'correct'}));
      } else {
        setFeedback(prev => ({...prev, [qIndex]: 'incorrect'}));
      }
    }
  };

  const handleUserSelection = (qIndex: number, selectedOption: string) => {
    setUserSelections(prev => ({...prev, [qIndex]: selectedOption}));
    if (quiz.questions[qIndex].answer === selectedOption) {
      setFeedback(prev => ({...prev, [qIndex]: 'correct'}));
    } else {
      setFeedback(prev => ({...prev, [qIndex]: 'incorrect'}));
    }
  };


  if (isLoading) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center"><HelpCircle className="mr-2 h-6 w-6 text-primary" /> Quiz</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-4 border border-muted rounded animate-pulse">
                <div className="h-6 w-full bg-muted rounded mb-2"></div>
                <div className="h-4 w-3/4 bg-muted rounded mb-1"></div>
                <div className="h-4 w-3/4 bg-muted rounded mb-1"></div>
                <div className="h-4 w-3/4 bg-muted rounded mb-1"></div>
                <div className="h-4 w-3/4 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center"><HelpCircle className="mr-2 h-6 w-6 text-primary" /> Generated Quiz</CardTitle>
        <CardDescription>
          Review and edit the quiz. Select an option for any question to see if it's correct. The "Correct Answer" field defines the actual right answer for editing purposes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {quiz.questions.map((q, qIndex) => (
          <Card key={qIndex} className="bg-card/50 p-4 shadow-md">
            <div className="mb-2">
              <Label htmlFor={`question-${qIndex}`} className="text-base font-semibold flex items-center">
                <Edit3 size={16} className="mr-2 text-accent" /> Question {qIndex + 1}
              </Label>
              <Input
                id={`question-${qIndex}`}
                value={q.question}
                onChange={(e) => handleQuestionTextChange(qIndex, e.target.value)}
                className="mt-1 border-input focus:ring-primary text-base"
                aria-label={`Question ${qIndex + 1} text input`}
              />
            </div>

            <div className="space-y-2 mb-3">
              <Label className="text-sm font-medium">Options (Click to select, editable text)</Label>
              <RadioGroup 
                value={userSelections[qIndex] || ""} 
                onValueChange={(value) => handleUserSelection(qIndex, value)}
                aria-label={`Options for question ${qIndex + 1}`}
              >
                {q.options.map((option, oIndex) => (
                  <div key={oIndex} className="flex items-center space-x-2 group">
                    <RadioGroupItem value={option} id={`q${qIndex}-option${oIndex}`} />
                    <Input
                      id={`q${qIndex}-option-text-${oIndex}`}
                      value={option}
                      onChange={(e) => handleOptionTextChange(qIndex, oIndex, e.target.value)}
                      className="flex-grow border-input focus:ring-primary group-hover:border-primary/50 transition-colors"
                      aria-label={`Option ${oIndex + 1} for question ${qIndex + 1} text input`}
                    />
                    {userSelections[qIndex] === option && feedback[qIndex] === 'correct' && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                    {userSelections[qIndex] === option && feedback[qIndex] === 'incorrect' && (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                ))}
              </RadioGroup>
            </div>
            
            {feedback[qIndex] && (
              <div className={cn(
                "mt-2 p-2 rounded-md text-sm",
                feedback[qIndex] === 'correct' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              )}>
                {feedback[qIndex] === 'correct' ? "Your selection is correct!" : "Your selection is incorrect."}
              </div>
            )}

            <div className="mt-3 p-2 bg-accent/10 rounded-md">
              <Label htmlFor={`answer-${qIndex}`} className="text-sm font-semibold flex items-center text-accent-foreground/80">
                 <AlertCircle size={16} className="mr-2 text-accent" /> Correct Answer (Editable source of truth)
              </Label>
               <Input
                id={`answer-${qIndex}`}
                value={q.answer}
                onChange={(e) => handleCorrectAnswerTextChange(qIndex, e.target.value)}
                className="mt-1 border-input focus:ring-primary bg-background"
                placeholder="Type the correct option text here"
                aria-label={`Correct answer definition for question ${qIndex + 1} text input`}
              />
              <p className="text-xs text-muted-foreground mt-1">
                This field defines the actual correct answer. Ensure it matches one of the options text exactly.
              </p>
            </div>
            {qIndex < quiz.questions.length - 1 && <Separator className="my-6" />}
          </Card>
        ))}
      </CardContent>
    </Card>
  );
}
