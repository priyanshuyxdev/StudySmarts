
"use client";

import type { GenerateQuizOutput } from "@/ai/flows/generate-quiz";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { HelpCircle, Edit3, CheckCircle, XCircle, Info, ListChecks } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface QuizDisplayProps {
  quiz: GenerateQuizOutput;
  onQuizChange: (newQuiz: GenerateQuizOutput) => void;
  isLoading: boolean;
}

export default function QuizDisplay({ quiz, onQuizChange, isLoading }: QuizDisplayProps) {
  const [userSelections, setUserSelections] = useState<{[key: number]: string | undefined}>({});
  const [feedback, setFeedback] = useState<{[key: number]: {isCorrect: boolean, reason?: string} | undefined}>({});

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
  
  const handleUserSelection = (qIndex: number, selectedOption: string, reasonForCorrect: string) => {
    setUserSelections(prev => ({...prev, [qIndex]: selectedOption}));
    const isCorrect = quiz.questions[qIndex].answer === selectedOption;
    setFeedback(prev => ({...prev, [qIndex]: { isCorrect, reason: reasonForCorrect }}));
  };

  const score = useMemo(() => {
    const correctAnswers = Object.values(feedback).filter(f => f?.isCorrect).length;
    const totalQuestions = quiz.questions.length;
    return {
      correct: correctAnswers,
      total: totalQuestions,
      answered: Object.keys(userSelections).length,
    };
  }, [feedback, quiz.questions, userSelections]);

  const allQuestionsAttempted = useMemo(() => {
    return quiz.questions.length > 0 && score.answered === quiz.questions.length;
  }, [quiz.questions.length, score.answered]);

  const resultsSummary = useMemo(() => {
    if (!allQuestionsAttempted) return [];
    return quiz.questions.map((q, index) => ({
      questionNumber: index + 1,
      userAnswer: userSelections[index],
      correctAnswerText: q.answer,
      isCorrect: feedback[index]?.isCorrect ?? false,
    }));
  }, [allQuestionsAttempted, quiz.questions, userSelections, feedback]);


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
          Review and edit the quiz questions. Select an option to see if it's correct and view the explanation.
          Your score and results summary will appear after attempting all questions.
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
              <Label className="text-sm font-medium">Options (Click to select)</Label>
              <RadioGroup 
                value={userSelections[qIndex] || ""} 
                onValueChange={(value) => handleUserSelection(qIndex, value, q.reason)}
                aria-label={`Options for question ${qIndex + 1}`}
                className="space-y-1"
              >
                {q.options.map((option, oIndex) => (
                  <Label 
                    htmlFor={`q${qIndex}-option${oIndex}`} 
                    key={oIndex}
                    className={cn(
                      "flex items-center space-x-3 p-3 border rounded-md cursor-pointer hover:bg-muted/80 transition-colors",
                      userSelections[qIndex] === option && feedback[qIndex]?.isCorrect ? "border-green-500 bg-green-50 dark:bg-green-900/30" : "",
                      userSelections[qIndex] === option && feedback[qIndex]?.isCorrect === false ? "border-red-500 bg-red-50 dark:bg-red-900/30" : ""
                    )}
                  >
                    <RadioGroupItem value={option} id={`q${qIndex}-option${oIndex}`} className="shrink-0" />
                    <span className="flex-grow text-sm">{option}</span>
                    {userSelections[qIndex] === option && feedback[qIndex]?.isCorrect && (
                      <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                    )}
                    {userSelections[qIndex] === option && feedback[qIndex]?.isCorrect === false && (
                      <XCircle className="h-5 w-5 text-red-500 shrink-0" />
                    )}
                  </Label>
                ))}
              </RadioGroup>
            </div>
            
            {feedback[qIndex] && (
              <>
                <Alert 
                  variant={feedback[qIndex]?.isCorrect ? "default" : "destructive"} 
                  className={cn(
                    "mt-2",
                    feedback[qIndex]?.isCorrect ? "bg-green-100 border-green-300 dark:bg-green-900/30 dark:border-green-700" : "bg-red-100 border-red-300 dark:bg-red-900/30 dark:border-red-700"
                  )}
                >
                  {feedback[qIndex]?.isCorrect ? <CheckCircle className="h-4 w-4 text-green-700 dark:text-green-400" /> : <XCircle className="h-4 w-4 text-red-700 dark:text-red-400" />}
                  <AlertTitle className={feedback[qIndex]?.isCorrect ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}>
                    {feedback[qIndex]?.isCorrect ? "Correct!" : "Incorrect."}
                  </AlertTitle>
                </Alert>
                <Alert variant="default" className="mt-2 bg-blue-50 border-blue-300 dark:bg-blue-900/30 dark:border-blue-700">
                  <Info className="h-4 w-4 text-blue-700 dark:text-blue-400" />
                  <AlertTitle className="text-blue-700 dark:text-blue-400">Explanation</AlertTitle>
                  <AlertDescription className="text-blue-700 dark:text-blue-400">
                    {feedback[qIndex]?.reason || "No reason provided."}
                  </AlertDescription>
                </Alert>
              </>
            )}
             <p className="text-xs text-muted-foreground mt-3">
                Note: The system uses the AI-generated answer and reason. You can edit question text.
              </p>
            {qIndex < quiz.questions.length - 1 && <Separator className="my-6" />}
          </Card>
        ))}
      </CardContent>

      {allQuestionsAttempted && (
        <CardFooter className="flex-col items-start space-y-4 p-6 border-t">
          <div className="w-full">
            <h3 className="text-xl font-semibold flex items-center mb-2">
                <ListChecks className="mr-2 h-6 w-6 text-primary" />
                Quiz Results
            </h3>
            <p className="text-2xl font-bold text-foreground mb-4">
              Your Score: {score.correct} / {score.total}
            </p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[90px] py-2 px-3 h-10">Q #</TableHead>
                  <TableHead className="py-2 px-3 h-10">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resultsSummary.map((result) => (
                  <TableRow key={result.questionNumber}>
                    <TableCell className="font-medium py-2 px-3">{result.questionNumber}</TableCell>
                    <TableCell className="py-2 px-3">
                      {result.isCorrect ? (
                        <span className="flex items-center text-green-600 dark:text-green-400">
                          <CheckCircle className="mr-1.5 h-4 w-4" /> Correct
                        </span>
                      ) : (
                        <span className="flex items-center text-red-600 dark:text-red-400">
                          <XCircle className="mr-1.5 h-4 w-4" /> Incorrect
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}

