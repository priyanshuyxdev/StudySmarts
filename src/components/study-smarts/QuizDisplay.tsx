
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

  const handleOptionTextChange = (qIndex: number, oIndex: number, value: string) => {
    const oldOptionText = quiz.questions[qIndex].options[oIndex];
    const currentQuestion = quiz.questions[qIndex];
    
    const updatedQuestions = quiz.questions.map((q, i) => {
      if (i === qIndex) {
        const updatedOptions = q.options.map((opt, optIdx) => (optIdx === oIndex ? value : opt));
        const newAnswer = q.answer === oldOptionText ? value : q.answer;
        return { ...q, options: updatedOptions, answer: newAnswer };
      }
      return q;
    });
    onQuizChange({ questions: updatedQuestions });

    // Update feedback if the selected option text changed or if the answer text changed
    if (userSelections[qIndex] === oldOptionText) { // if the edited option was selected
        handleUserSelection(qIndex, value, currentQuestion.reason);
    } else if (currentQuestion.answer === oldOptionText && userSelections[qIndex] !== undefined) { // if the edited option was the answer
        // Re-evaluate feedback for the currently selected option
        handleUserSelection(qIndex, userSelections[qIndex]!, currentQuestion.reason);
    }
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
          Review and edit the quiz questions and options. Select an option to see if it's correct and view the explanation.
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
              <Label className="text-sm font-medium">Options (Click to select, editable text)</Label>
              <RadioGroup 
                value={userSelections[qIndex] || ""} 
                onValueChange={(value) => handleUserSelection(qIndex, value, q.reason)}
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
                    {userSelections[qIndex] === option && feedback[qIndex]?.isCorrect && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                    {userSelections[qIndex] === option && feedback[qIndex]?.isCorrect === false && (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
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
                Note: The system uses the AI-generated 'answer' and 'reason'. You can edit question and option text.
                If you edit an option that was the designated answer, the answer updates.
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
                  <TableHead className="w-[120px]">Question #</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resultsSummary.map((result) => (
                  <TableRow key={result.questionNumber}>
                    <TableCell className="font-medium">{result.questionNumber}</TableCell>
                    <TableCell>
                      {result.isCorrect ? (
                        <span className="flex items-center text-green-600 dark:text-green-400">
                          <CheckCircle className="mr-2 h-5 w-5" /> Correct
                        </span>
                      ) : (
                        <span className="flex items-center text-red-600 dark:text-red-400">
                          <XCircle className="mr-2 h-5 w-5" /> Incorrect
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
