
// @ts-nocheck
"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useState, useEffect, useRef } from "react";
import { BookOpenText, FileText, UploadCloud, Loader2, Info, AlertTriangle, Wand2, HelpCircle, UserCircle, Briefcase, Users, ListChecks, Trash2, Download, FileSliders, MessageSquareText, Layers, Maximize, Minimize, TableIcon, Menu, FileQuestion, BookMarked } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useStudyContext, type StudentAttempt } from '@/context/StudyContext';

import { summarizeDocument, type SummarizeDocumentOutput, type SummaryLength } from "@/ai/flows/summarize-document";
import { generateQuiz, type GenerateQuizOutput } from "@/ai/flows/generate-quiz";
import { generateCustomQuiz } from "@/ai/flows/generate-custom-quiz";
import { generateFlashcards, type GenerateFlashcardsOutput } from "@/ai/flows/generate-flashcards";


import SummaryDisplay from "./SummaryDisplay";
import QuizDisplay from "./QuizDisplay";
import DownloadStudyAidsButton from "./DownloadStudyAidsButton";
import FlashcardViewer from "./FlashcardViewer";
import ChatBot from "./ChatBot";
import TimerClockDialog from "./TimerClockDialog";


import * as pdfjsLib from 'pdfjs-dist';

const PDFJS_WORKER_SRC = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.mjs`;

export default function StudySmartsPage() {
  const { currentUser, setTeacherQuizData, teacherQuizData, studentAttempts, clearTeacherQuizData } = useStudyContext();
  
  const isTeacherOnline = currentUser?.role === 'teacher';
  const isStudentOnline = currentUser?.role === 'student';
  const isGuestOnline = !currentUser;

  const [documentName, setDocumentName] = useState<string | null>(null);
  const [documentText, setDocumentText] = useState<string>("");
  const [isFileUploaded, setIsFileUploaded] = useState<boolean>(false);
  const [isPdfProcessing, setIsPdfProcessing] = useState<boolean>(false);

  const [summary, setSummary] = useState<SummarizeDocumentOutput | null>(null);
  const [quiz, setQuiz] = useState<GenerateQuizOutput | null>(null);
  const [flashcards, setFlashcards] = useState<GenerateFlashcardsOutput['flashcards'] | null>(null);
  
  const [isLoadingSummary, setIsLoadingSummary] = useState<boolean>(false);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState<boolean>(false);
  const [isLoadingFlashcards, setIsLoadingFlashcards] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [customQuizTopic, setCustomQuizTopic] = useState<string>("");
  const [customNumQuestions, setCustomNumQuestions] = useState<number>(10);
  const [isCustomQuizModeActive, setIsCustomQuizModeActive] = useState<boolean>(false); 

  const [summaryLength, setSummaryLength] = useState<SummaryLength>('medium');
  const [summaryFocus, setSummaryFocus] = useState<string>('');

  const [scrollToQuizSignal, setScrollToQuizSignal] = useState<boolean>(false);
  const quizSectionRef = useRef<HTMLDivElement>(null);
  const flashcardsSectionRef = useRef<HTMLDivElement>(null);
  const studentAttemptsSectionRef = useRef<HTMLDivElement>(null);


  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_SRC;
    }
  }, []);
  
  useEffect(() => {
    if (isTeacherOnline) {
      if (teacherQuizData) {
        setSummary(teacherQuizData.summary);
        setQuiz(teacherQuizData.quiz);
        setDocumentName(teacherQuizData.documentName);
        setFlashcards(null); 
        const isTeacherDataCustom = teacherQuizData.documentName.toLowerCase().startsWith("custom quiz:");
        setIsCustomQuizModeActive(isTeacherDataCustom);
        if (isTeacherDataCustom) {
            setCustomQuizTopic(teacherQuizData.documentName.replace(/^Custom Quiz:\s*/i, ""));
        } else {
            setCustomQuizTopic(""); 
        }
      } else {
         resetAllLocalCreationState();
      }
    } else if (isStudentOnline) {
      resetAllLocalCreationState(); 
    }
  }, [currentUser, teacherQuizData, isTeacherOnline, isStudentOnline]);


  const resetAllLocalCreationState = () => {
    setDocumentName(null);
    setDocumentText("");
    setIsFileUploaded(false);
    setSummary(null);
    setQuiz(null);
    setFlashcards(null);
    setCustomQuizTopic("");
    setIsCustomQuizModeActive(false); 
    setSummaryLength('medium');
    setSummaryFocus('');
    setError(null);
  };


  useEffect(() => {
    if (scrollToQuizSignal && quizSectionRef.current) {
      quizSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setScrollToQuizSignal(false);
    }
  }, [scrollToQuizSignal]);
  
  useEffect(() => {
    if (flashcardsSectionRef.current && flashcards && flashcards.length > 0) {
        flashcardsSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [flashcards]);
  
  useEffect(() => {
    if (studentAttemptsSectionRef.current && isTeacherOnline && teacherQuizData && studentAttempts.length > 0) {
        studentAttemptsSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [studentAttempts, teacherQuizData, isTeacherOnline]); 


  const resetDocumentState = () => {
    setDocumentName(null);
    setDocumentText("");
    setIsFileUploaded(false);
    setError(null);
    setFlashcards(null);
    setSummaryLength('medium');
    setSummaryFocus('');
    if (!isTeacherOnline || !teacherQuizData) { 
      if (!isCustomQuizModeActive) { 
          setSummary(null);
          setQuiz(null);
      }
    }
  }

  const prepareForCustomQuizGeneration = () => {
    if (!isCustomQuizModeActive) { 
        setError(null);
        setSummary(null); 
        setQuiz(null);    
        setFlashcards(null);
        setDocumentName(null);
        setDocumentText("");
        setIsFileUploaded(false);
        setSummaryLength('medium');
        setSummaryFocus('');
    }
    setIsCustomQuizModeActive(true);
  }

  const prepareForDocumentProcessing = () => {
    if (isCustomQuizModeActive) { 
      setCustomQuizTopic("");
      setError(null);
      setFlashcards(null);
      if (!isTeacherOnline || !teacherQuizData) {
        setSummary(null);
        setQuiz(null);
      }
    }
    setIsCustomQuizModeActive(false);
  }


  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    prepareForDocumentProcessing(); 
    resetDocumentState(); 

    if (file) {
      setDocumentName(file.name);
      setIsFileUploaded(true);
      
      if (file.type === "application/pdf") {
        setIsPdfProcessing(true);
        toast({ title: "Processing PDF...", description: `Extracting text from "${file.name}".` });
        try {
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          let fullText = "";
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item: any) => item.str).join(" ");
            fullText += pageText + "\\n"; 
          }
          setDocumentText(fullText.trim());
          toast({ title: "PDF Processed", description: `Text extracted from "${file.name}".` });
        } catch (pdfError: any) {
          setError(`Failed to process PDF: ${pdfError.message || "Unknown error"}.`);
          toast({ variant: "destructive", title: "PDF Error", description: `Could not extract text.`});
          setDocumentText("");
        } finally {
          setIsPdfProcessing(false);
        }
      } else if (file.type.startsWith("text/")) {
        const reader = new FileReader();
        reader.onload = (e) => setDocumentText(e.target?.result as string);
        reader.readAsText(file);
        toast({ title: "Text File Loaded", description: `Content from "${file.name}" loaded.`});
      } else {
        setDocumentText(""); 
        setError("Unsupported file. Please upload PDF/text or paste content.");
        toast({ variant: "default", title: "Unsupported File", description: "Upload PDF/text or paste."});
      }
    } else {
      resetDocumentState();
    }
  };

  const handleGenerateDocumentAids = async (event: FormEvent) => {
    event.preventDefault();
    if (isCustomQuizModeActive) { 
        toast({variant: "default", title: "Mode Conflict", description: "Switch to document processing mode first."});
        return;
    }
    if (!documentText.trim() && !isPdfProcessing) {
      setError("Document content is empty.");
      toast({ variant: "destructive", title: "Empty Content", description: "Please provide document content." });
      return;
    }
    if (isPdfProcessing) return; 

    setError(null);
    setSummary(null); 
    setQuiz(null);    
    setFlashcards(null);
    setIsLoadingSummary(true);
    setIsLoadingQuiz(false); 
    const currentDocName = documentName || "Uploaded Document"; 
    setDocumentName(currentDocName); 
    toast({ title: "Generating Study Aids...", description: `Processing "${currentDocName}". This may take a moment.` });

    try {
      const summaryResult = await summarizeDocument({ 
        documentText,
        summaryLength: summaryLength,
        summaryFocus: summaryFocus || undefined
      });
      setSummary(summaryResult);
      toast({ title: "Summary Generated" });
      setIsLoadingSummary(false);

      setIsLoadingQuiz(true);
      try {
        const quizResult = await generateQuiz({ summary: summaryResult.summary });
        setQuiz(quizResult);
        setScrollToQuizSignal(true);
        toast({ title: "Quiz Generated" });

        if (isTeacherOnline) {
          setTeacherQuizData({ summary: summaryResult, quiz: quizResult, documentName: currentDocName });
        }
      } catch (quizError: any)
      {
        setError("Failed to generate quiz: " + (quizError.message || "Unknown error"));
        toast({ variant: "destructive", title: "Quiz Error", description: "Quiz generation failed."});
      } finally {
        setIsLoadingQuiz(false);
      }
    } catch (summaryError: any) {
      setError("Failed to summarize: " + (summaryError.message || "Unknown error"));
      toast({ variant: "destructive", title: "Summary Error", description: "Summarization failed."});
      setIsLoadingSummary(false);
      setIsLoadingQuiz(false); 
    }
  };

  const handleGenerateCustomQuiz = async (event: FormEvent) => {
    event.preventDefault();
    if (!isCustomQuizModeActive){ 
        toast({variant: "default", title: "Mode Conflict", description: "Activate custom quiz mode first (by typing a topic).."});
        return;
    }
    if (!customQuizTopic.trim()) {
      setError("Custom quiz topic cannot be empty.");
      toast({ variant: "destructive", title: "Empty Topic", description: "Please provide a topic." });
      return;
    }
    
    setError(null);
    setSummary(null); 
    setQuiz(null);    
    setFlashcards(null);
    setIsLoadingQuiz(true);
    setIsLoadingSummary(false); 
    
    const tempDocName = `Custom Quiz: ${customQuizTopic}`;
    setDocumentName(tempDocName); 
    toast({ title: "Generating Custom Quiz...", description: `Creating quiz for "${customQuizTopic}".` });

    try {
      const customQuizResult = await generateCustomQuiz({ topic: customQuizTopic, numQuestions: customNumQuestions });
      const placeholderSummary: SummarizeDocumentOutput = { 
        summary: `This quiz is based on the topic: "${customQuizTopic}". No detailed document summary is available for custom quizzes. Study aids for custom quizzes focus primarily on the quiz itself.`, 
        sectionSummaries: undefined 
      };
      setQuiz(customQuizResult); 
      setSummary(placeholderSummary);  
      setScrollToQuizSignal(true);
      toast({ title: "Custom Quiz Generated", description: `Quiz for "${customQuizTopic}" is ready.` });

      if (isTeacherOnline) {
         setTeacherQuizData({ summary: placeholderSummary, quiz: customQuizResult, documentName: tempDocName });
      }

    } catch (customQuizError: any) {
      setError("Failed to generate custom quiz: " + (customQuizError.message || "Unknown error"));
      toast({ variant: "destructive", title: "Custom Quiz Failed", description: "Generation failed."});
    } finally {
      setIsLoadingQuiz(false);
    }
  };
  
  const handleGenerateFlashcards = async () => {
    if (!effectiveSummary?.summary || effectiveIsCustomQuizMode) {
      toast({ variant: "destructive", title: "Cannot Generate Flashcards", description: "Flashcards can only be generated from a document summary." });
      return;
    }
    setFlashcards(null);
    setIsLoadingFlashcards(true);
    toast({ title: "Generating Flashcards...", description: `Extracting key terms from summary.` });
    try {
      const result = await generateFlashcards({ summaryText: effectiveSummary.summary });
      setFlashcards(result.flashcards);
      toast({ title: "Flashcards Generated!" });
    } catch (flashcardError: any) {
      setError("Failed to generate flashcards: " + (flashcardError.message || "Unknown error"));
      toast({ variant: "destructive", title: "Flashcard Error", description: "Flashcard generation failed."});
    } finally {
      setIsLoadingFlashcards(false);
    }
  };


  const handleClearActiveQuiz = () => {
    if (isTeacherOnline) {
        clearTeacherQuizData(); 
        resetAllLocalCreationState(); 
        toast({ title: "Active Quiz Cleared", description: "No quiz is currently active for students." });
    }
  };

  const handleSummaryChange = (newSummary: SummarizeDocumentOutput) => {
    setSummary(newSummary); 
    if (isTeacherOnline && quiz && documentName) { 
        setTeacherQuizData({summary: newSummary, quiz, documentName});
    }
  };

  const handleQuizChange = (newQuiz: GenerateQuizOutput) => {
    setQuiz(newQuiz); 
     if (isTeacherOnline && summary && documentName) { 
        setTeacherQuizData({summary, quiz: newQuiz, documentName});
    }
  };
  
  const totalLoadingProgress = () => {
    if (isPdfProcessing && !isCustomQuizModeActive) return 15;
    if (isLoadingSummary && !summary && !isCustomQuizModeActive) return 30; 
    if (isLoadingFlashcards && !flashcards && !isCustomQuizModeActive) return 50;
    if (isLoadingQuiz) return 75; 
    if ((summary && quiz && !isCustomQuizModeActive) || (quiz && isCustomQuizModeActive && summary )) return 100;
    return 0;
  }

  const effectiveSummary = (isTeacherOnline && teacherQuizData) ? teacherQuizData.summary : summary;
  const effectiveQuiz = (isTeacherOnline && teacherQuizData) ? teacherQuizData.quiz : quiz;
  const effectiveDocumentName = (isTeacherOnline && teacherQuizData) 
      ? teacherQuizData.documentName 
      : isCustomQuizModeActive && customQuizTopic 
          ? `Custom Quiz: ${customQuizTopic}` 
          : documentName;
  
  const effectiveIsCustomQuizMode = effectiveDocumentName?.toLowerCase().startsWith("custom quiz:") ?? isCustomQuizModeActive;


  const filteredStudentAttempts = (isTeacherOnline && teacherQuizData && studentAttempts) 
    ? studentAttempts.filter(attempt => attempt.quizName === teacherQuizData.documentName)
    : [];

  if (isStudentOnline) { 
    return (
        <main className="w-full max-w-4xl space-y-6 p-4 md:p-8 mt-4 mx-auto flex-grow">
            <Card className="shadow-xl rounded-xl">
                <CardHeader className="bg-gradient-to-r from-sky-50 to-cyan-50 dark:from-sky-900/30 dark:to-cyan-900/30 p-5 sm:p-6 rounded-t-xl">
                    <CardTitle className="flex items-center text-lg sm:text-xl">
                        <UserCircle className="mr-2 h-7 w-7 text-primary" /> Student Portal Access
                    </CardTitle>
                    <CardDescription className="text-sm">
                        Welcome, {currentUser.id}! If not redirected, please use the "Student" link in the navbar to access your quiz.
                    </CardDescription>
                </CardHeader>
                 <CardContent className="p-5 sm:p-6">
                    <p className="text-muted-foreground">Your assigned quiz is available on the Student page. Please navigate there to take it.</p>
                </CardContent>
            </Card>
             <footer className="w-full text-center p-4 mt-auto">
                <p className="text-xs sm:text-sm text-muted-foreground">Made by Priyanshu, Ritik & Tushar</p>
                <p className="text-xs sm:text-sm text-muted-foreground">&copy; {new Date().getFullYear()} StudySmarts. All rights reserved.</p>
            </footer>
        </main>
    )
  }


  return (
    <div className="flex flex-col flex-grow items-center bg-gradient-to-br from-slate-50 to-sky-100 dark:from-slate-900 dark:to-sky-950">
      <main className="w-full max-w-4xl space-y-6 p-4 md:p-8 mt-4">
         <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Welcome to StudySmarts
          </h1>
          <p className="mt-2 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Your AI-powered assistant to summarize documents, generate quizzes, create flashcards, and enhance your learning experience.
          </p>
        </div>

        { isTeacherOnline && (
             <Alert variant="default" className="bg-primary/10 border-primary/30 dark:bg-primary/20 dark:border-primary/40 shadow-xl rounded-lg mb-6">
                <Briefcase className="mr-2 h-5 w-5 text-primary" />
                <AlertTitle className="text-primary font-semibold">Teacher Mode ({currentUser.id})</AlertTitle>
                <AlertDescription>
                    {teacherQuizData 
                        ? <>Currently active quiz for students: <strong className="text-foreground">"{teacherQuizData.documentName}"</strong>. Study aids you generate here will become the active material for students.</>
                        : 'Generate study aids from a document or custom topic to make them available for students.'}
                </AlertDescription>
                 {teacherQuizData && (
                    <Button onClick={handleClearActiveQuiz} variant="destructive" size="sm" className="mt-3 shadow-md hover:shadow-lg">
                        <Trash2 className="mr-2 h-4 w-4" /> Clear Active Quiz for Students
                    </Button>
                 )}
            </Alert>
        )}
        
        {/* Main content grid for custom quiz and document processing */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-xl border-2 border-purple-300 dark:border-purple-700/80 rounded-xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 p-4 sm:p-6 rounded-t-xl">
                <CardTitle as="h2" className="flex items-center text-base sm:text-xl font-semibold">
                  <FileQuestion className="mr-2 h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" />
                  1. Create Custom Quiz by Topic
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Enter a topic or phrase to generate a quiz.
                  {isTeacherOnline && " This quiz will be set for students if generated."}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <form onSubmit={handleGenerateCustomQuiz} className="space-y-3 sm:space-y-4">
                  <div className="space-y-1">
                    <Label htmlFor="custom-topic" className="text-xs sm:text-sm font-medium">Enter Topic/Phrase</Label>
                    <Input 
                      id="custom-topic" 
                      placeholder="e.g., 'The Solar System'"
                      value={customQuizTopic}
                      onChange={(e) => {
                        setCustomQuizTopic(e.target.value);
                        if (e.target.value.trim() !== "") {
                            prepareForCustomQuizGeneration();
                        } else if (isCustomQuizModeActive && !effectiveQuiz && !documentText) { 
                            setIsCustomQuizModeActive(false); 
                        }
                      }}
                      className="border-input focus:ring-purple-500 shadow-sm text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs sm:text-sm font-medium">Number of Questions</Label>
                    <RadioGroup 
                      value={String(customNumQuestions)} 
                      onValueChange={(value) => {
                        setCustomNumQuestions(Number(value));
                        if(customQuizTopic.trim() !== "") prepareForCustomQuizGeneration(); 
                      }} 
                      className="flex flex-wrap gap-x-3 gap-y-1.5 sm:gap-x-4 sm:gap-y-2"
                    >
                      {[5, 10, 15, 20].map(num => (
                        <div key={num} className="flex items-center space-x-1.5 sm:space-x-2">
                          <RadioGroupItem value={String(num)} id={`num-${num}`} />
                          <Label htmlFor={`num-${num}`} className="cursor-pointer text-xs sm:text-sm">{num}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full text-sm sm:text-base font-semibold text-white bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 hover:from-purple-600 hover:via-pink-600 hover:to-red-600 focus:ring-4 focus:outline-none focus:ring-pink-300 dark:focus:ring-pink-800 shadow-lg shadow-pink-500/50 dark:shadow-lg dark:shadow-pink-800/80 rounded-lg py-2.5 sm:py-3 text-center transition-all duration-300 ease-in-out transform hover:scale-105"
                    disabled={isLoadingQuiz || isPdfProcessing || isLoadingSummary || isLoadingFlashcards || customQuizTopic.trim() === ""}
                  >
                    {isLoadingQuiz && isCustomQuizModeActive ? ( 
                      <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                    ) : (
                      <Wand2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    )}
                    Generate Custom Quiz
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="shadow-xl border-2 border-sky-300 dark:border-sky-700/80 rounded-xl overflow-hidden">
               <CardHeader className="bg-gradient-to-r from-sky-50 to-cyan-50 dark:from-sky-900/30 dark:to-cyan-900/30 p-4 sm:p-6 rounded-t-xl">
                <CardTitle as="h2" className="flex items-center text-base sm:text-xl font-semibold">
                  <BookMarked className="mr-2 h-5 w-5 sm:h-6 sm:w-6 text-sky-600 dark:text-sky-400" />
                  2. Process Document
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Upload a PDF/text file for summary, quiz, and flashcard generation.
                  {isTeacherOnline && " This will be set for students if generated."}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <form onSubmit={handleGenerateDocumentAids} className="space-y-3 sm:space-y-4">
                  <div className="space-y-1">
                    <Label htmlFor="file-upload" className="text-xs sm:text-sm font-medium">Select File (PDF or .txt, .md)</Label>
                    <Input id="file-upload" type="file" accept=".pdf,text/plain,.txt,.md" onChange={handleFileChange} 
                      className="file:text-primary file:font-semibold file:mr-2 sm:file:mr-4 file:py-1.5 sm:file:py-2 file:px-2 sm:file:px-4 file:rounded-lg file:border-0 file:bg-primary/10 hover:file:bg-primary/20 transition-colors cursor-pointer shadow-sm text-xs sm:text-sm"
                    />
                    {isFileUploaded && !isCustomQuizModeActive && documentName && ( 
                      <p className="text-xs sm:text-sm text-muted-foreground flex items-center mt-1">
                        <FileText size={14} className="mr-1" /> Selected: {documentName}
                        {isPdfProcessing && " (Extracting text...)"}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="summary-length" className="text-xs sm:text-sm font-medium flex items-center">
                        <FileSliders className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                        Summary Length
                      </Label>
                      <Select value={summaryLength} onValueChange={(value: SummaryLength) => {
                        setSummaryLength(value);
                        if (documentText.trim() !== "" && isCustomQuizModeActive) prepareForDocumentProcessing();
                      }}
                      disabled={isCustomQuizModeActive && !documentText}
                      >
                        <SelectTrigger id="summary-length" className="w-full shadow-sm text-xs sm:text-sm">
                          <SelectValue placeholder="Select length" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="brief">Brief</SelectItem>
                          <SelectItem value="medium">Medium (Default)</SelectItem>
                          <SelectItem value="detailed">Detailed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="summary-focus" className="text-xs sm:text-sm font-medium flex items-center">
                        <MessageSquareText className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                        Summary Focus (Optional)
                      </Label>
                      <Input 
                        id="summary-focus"
                        placeholder="e.g., 'key algorithms'"
                        value={summaryFocus}
                        onChange={(e) => {
                          setSummaryFocus(e.target.value);
                          if (documentText.trim() !== "" && isCustomQuizModeActive) prepareForDocumentProcessing();
                        }}
                        className="border-input shadow-sm text-xs sm:text-sm"
                        disabled={isCustomQuizModeActive && !documentText}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="document-text" className="text-xs sm:text-sm font-medium">
                      Document Content 
                    </Label>
                    <Textarea
                      id="document-text"
                      placeholder={
                        isPdfProcessing && !isCustomQuizModeActive
                          ? "Extracting text from PDF..." 
                          : isFileUploaded && documentText && !isCustomQuizModeActive 
                            ? "Text from uploaded file. You can edit it before generating aids."
                            : isCustomQuizModeActive 
                              ? "Custom Quiz mode is active. This section is for document processing."
                              : "Paste document text here, or upload a file above." 
                      }
                      value={isCustomQuizModeActive ? "" : documentText} 
                      onChange={(e) => {
                        setDocumentText(e.target.value);
                        if (e.target.value.trim() !== "" && isCustomQuizModeActive) { 
                            prepareForDocumentProcessing(); 
                        }
                      }}
                      rows={6}
                      className="border-input focus:ring-primary shadow-sm text-xs sm:text-sm"
                      readOnly={isPdfProcessing && !isCustomQuizModeActive} 
                      disabled={isCustomQuizModeActive && !documentText} 
                    />
                     {isFileUploaded && !isPdfProcessing && documentName?.endsWith('.pdf') && documentText && !error && !isCustomQuizModeActive && (
                        <Alert variant="default" className="mt-2 bg-green-50 border-green-300 dark:bg-green-900/30 dark:border-green-700 shadow-sm rounded-md text-xs sm:text-sm">
                            <Info className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-700 dark:text-green-400" />
                            <AlertTitle className="text-green-700 dark:text-green-400">PDF Ready</AlertTitle>
                            <AlertDescription className="text-green-700 dark:text-green-400">
                                PDF text extracted. You can edit it or generate study aids.
                            </AlertDescription>
                        </Alert>
                    )}
                     {isFileUploaded && isPdfProcessing && !isCustomQuizModeActive && (
                        <Alert variant="default" className="mt-2 shadow-sm rounded-md text-xs sm:text-sm">
                            <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                            <AlertTitle>PDF Processing</AlertTitle>
                            <AlertDescription>Extracting text from PDF...</AlertDescription>
                        </Alert>
                    )}
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-shadow text-sm sm:text-base font-semibold py-2.5 sm:py-3 rounded-lg"
                    disabled={isLoadingSummary || isLoadingQuiz || isPdfProcessing || isCustomQuizModeActive || isLoadingFlashcards || (documentText.trim() === "" && !isPdfProcessing)}
                  >
                    {(isLoadingSummary || (isLoadingQuiz && !isCustomQuizModeActive && !isPdfProcessing && !isCustomQuizModeActive)) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {(isPdfProcessing && !isCustomQuizModeActive) ? 'Processing File...' : 'Generate Study Aids from Document'}
                  </Button>
                </form>
              </CardContent>
            </Card>
        </div>
        
        {error && (
          <Alert variant="destructive" className="my-4 shadow-md rounded-lg text-xs sm:text-sm">
              <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {(isLoadingSummary || isLoadingQuiz || (isPdfProcessing && !isCustomQuizModeActive) || isLoadingFlashcards) && (
          <Card className="shadow-lg mt-6 rounded-xl">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">Processing...</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <Progress value={totalLoadingProgress()} className="w-full" />
              <p className="text-center text-muted-foreground mt-2 text-xs sm:text-sm">
                {isPdfProcessing && !isCustomQuizModeActive ? "Extracting text from PDF..." : ""}
                {isLoadingSummary && !summary && !isCustomQuizModeActive ? " Generating summary..." : ""}
                {isLoadingFlashcards && !flashcards && !isCustomQuizModeActive ? " Generating flashcards..." : ""}
                {isLoadingQuiz && !isPdfProcessing ? " Generating quiz..." : ""}
              </p>
            </CardContent>
          </Card>
        )}
        
        <div ref={quizSectionRef}>
            {effectiveSummary && !isLoadingSummary && (!isCustomQuizModeActive || effectiveIsCustomQuizMode) && (isTeacherOnline || isGuestOnline) && (
              <>
                <SummaryDisplay 
                  summary={effectiveSummary} 
                  onSummaryChange={handleSummaryChange} 
                  isLoading={isLoadingSummary}
                  isEditable={isTeacherOnline || isGuestOnline} 
                />
                
                { (isTeacherOnline || isGuestOnline) && 
                  effectiveSummary && 
                  !effectiveIsCustomQuizMode && 
                  !isLoadingSummary && (
                   <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <DownloadStudyAidsButton
                        summary={effectiveSummary}
                        quiz={null}
                        documentName={effectiveDocumentName}
                        isCustomQuiz={false}
                        downloadType="summary"
                        className="w-full h-full text-xs sm:text-sm py-2.5 sm:py-3 rounded-lg shadow-md hover:shadow-lg transition-shadow"
                      />
                      <Button
                        onClick={handleGenerateFlashcards}
                        className="w-full h-full bg-secondary hover:bg-secondary/80 text-secondary-foreground shadow-md hover:shadow-lg transition-shadow rounded-lg text-xs sm:text-sm py-2.5 sm:py-3"
                        disabled={isLoadingFlashcards || !effectiveSummary?.summary || effectiveIsCustomQuizMode}
                      >
                        {isLoadingFlashcards ? <Loader2 className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" /> : <Layers className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                        Generate Flashcards
                      </Button>
                    </div>
                )}
              </>
            )}
            
            <div ref={flashcardsSectionRef}>
                {flashcards && flashcards.length > 0 && !isLoadingFlashcards && (isTeacherOnline || isGuestOnline) && (
                    <FlashcardViewer flashcards={flashcards} isLoading={isLoadingFlashcards} />
                )}
            </div>


            {effectiveQuiz && effectiveSummary && !isLoadingQuiz && (isTeacherOnline || isGuestOnline) && (
              <div className="mt-6">
                <QuizDisplay 
                  quiz={effectiveQuiz} 
                  onQuizChange={handleQuizChange} 
                  isLoading={isLoadingQuiz}
                  documentSummary={(!effectiveIsCustomQuizMode && effectiveSummary) ? effectiveSummary.summary : undefined} 
                  documentName={effectiveDocumentName || undefined} 
                  isEditable={isTeacherOnline || isGuestOnline} 
                />
              </div>
            )}
        </div>
        
        {(effectiveSummary && effectiveQuiz && !isLoadingSummary && !isLoadingQuiz) && (isTeacherOnline || isGuestOnline) && (
          <DownloadStudyAidsButton 
            summary={effectiveSummary} 
            quiz={effectiveQuiz} 
            documentName={effectiveDocumentName}
            isCustomQuiz={effectiveIsCustomQuizMode}
            downloadType="full"
            className="mt-6 text-xs sm:text-sm"
          />
        )}

        {isTeacherOnline && teacherQuizData && (
          <div ref={studentAttemptsSectionRef} className="mt-8" key={teacherQuizData.documentName}>
            <Card className="shadow-xl border-2 border-green-300 dark:border-green-700/80 rounded-xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-green-50 to-lime-50 dark:from-green-900/30 dark:to-lime-900/30 p-4 sm:p-6 rounded-t-xl">
                <CardTitle className="flex items-center text-base sm:text-xl">
                  <Users className="mr-2 h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
                  Student Attempts for "{teacherQuizData.documentName}"
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Scores of students who have attempted this quiz. Data persists for the current browser session on the same computer.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0"> {/* Remove padding for table to use full width */}
                {filteredStudentAttempts.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="px-2 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm">Student ID</TableHead>
                          <TableHead className="px-2 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm">Score</TableHead>
                          <TableHead className="text-right px-2 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm">Date & Time</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredStudentAttempts.map((attempt, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium px-2 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm">{attempt.studentId}</TableCell>
                            <TableCell className="px-2 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm">{attempt.score} / {attempt.totalQuestions}</TableCell>
                            <TableCell className="text-right px-2 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm">
                              {new Date(attempt.timestamp).toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="p-4 sm:p-6 text-muted-foreground text-center text-xs sm:text-sm">No student attempts recorded for this quiz yet in this session.</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
        
      </main>
      <footer className="w-full text-center p-4 mt-auto">
        <p className="text-xs sm:text-sm text-muted-foreground">Made by Priyanshu, Ritik & Tushar</p>
        <p className="text-xs sm:text-sm text-muted-foreground">&copy; {new Date().getFullYear()} StudySmarts. All rights reserved.</p>
      </footer>
      <ChatBot />
      <TimerClockDialog />
    </div>
  );
}
    
