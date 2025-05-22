"use client";

import type { GenerateQuizOutput } from "@/ai/flows/generate-quiz";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { HelpCircle, Edit3, CheckCircle } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface QuizDisplayProps {
  quiz: GenerateQuizOutput;
  onQuizChange: (newQuiz: GenerateQuizOutput) => void;
  isLoading: boolean;
}

export default function QuizDisplay({ quiz, onQuizChange, isLoading }: QuizDisplayProps) {
  
  const handleQuestionChange = (index: number, field: string, value: string) => {
    const updatedQuestions = quiz.questions.map((q, i) => {
      if (i === index) {
        return { ...q, [field]: value };
      }
      return q;
    });
    onQuizChange({ questions: updatedQuestions });
  };

  const handleOptionChange = (qIndex: number, oIndex: number, value: string) => {
    const updatedQuestions = quiz.questions.map((q, i) => {
      if (i === qIndex) {
        const updatedOptions = q.options.map((opt, optIdx) => (optIdx === oIndex ? value : opt));
        // If the edited option was the answer, update the answer as well
        // This simple logic assumes answer is just the text of the option.
        // A more robust system might use indices or unique IDs.
        const newAnswer = q.answer === q.options[oIndex] ? value : q.answer;
        return { ...q, options: updatedOptions, answer: newAnswer };
      }
      return q;
    });
    onQuizChange({ questions: updatedQuestions });
  };

  const handleAnswerChange = (qIndex: number, newAnswerValue: string) => {
    // newAnswerValue is the text of the selected option
    const updatedQuestions = quiz.questions.map((q, i) => {
      if (i === qIndex) {
        return { ...q, answer: newAnswerValue };
      }
      return q;
    });
    onQuizChange({ questions: updatedQuestions });
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
        <CardDescription>Review and edit the quiz questions, options, and answers.</CardDescription>
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
                onChange={(e) => handleQuestionChange(qIndex, "question", e.target.value)}
                className="mt-1 border-input focus:ring-primary text-base"
                aria-label={`Question ${qIndex + 1} text input`}
              />
            </div>

            <div className="space-y-2 mb-3">
              <Label className="text-sm font-medium">Options (Editable)</Label>
              <RadioGroup 
                value={q.answer} 
                onValueChange={(value) => handleAnswerChange(qIndex, value)}
                aria-label={`Options for question ${qIndex + 1}`}
              >
                {q.options.map((option, oIndex) => (
                  <div key={oIndex} className="flex items-center space-x-2 group">
                    <RadioGroupItem value={option} id={`q${qIndex}-option${oIndex}`} />
                    <Input
                      id={`q${qIndex}-option-text-${oIndex}`}
                      value={option}
                      onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                      className="flex-grow border-input focus:ring-primary group-hover:border-primary/50 transition-colors"
                      aria-label={`Option ${oIndex + 1} for question ${qIndex + 1} text input`}
                    />
                  </div>
                ))}
              </RadioGroup>
            </div>
            
            <div className="mt-2 p-2 bg-accent/10 rounded-md">
              <Label htmlFor={`answer-${qIndex}`} className="text-sm font-semibold flex items-center text-accent-foreground/80">
                 <CheckCircle size={16} className="mr-2 text-accent" /> Correct Answer (Ensure this matches one of the options above)
              </Label>
               <Input
                id={`answer-${qIndex}`}
                value={q.answer}
                onChange={(e) => handleQuestionChange(qIndex, "answer", e.target.value)}
                className="mt-1 border-input focus:ring-primary bg-background"
                placeholder="Type the correct option text here"
                aria-label={`Correct answer for question ${qIndex + 1} text input`}
              />
            </div>
            {qIndex < quiz.questions.length - 1 && <Separator className="my-6" />}
          </Card>
        ))}
      </CardContent>
    </Card>
  );
}
