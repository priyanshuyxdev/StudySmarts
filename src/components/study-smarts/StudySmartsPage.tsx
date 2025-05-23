
"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useState, useEffect, useRef } from "react";
import { BookOpenText, FileText, UploadCloud, Loader2, Info, AlertTriangle, Wand2, HelpCircle, UserCircle, Briefcase, Users, ListChecks, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useStudyContext } from '@/context/StudyContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";


import { summarizeDocument, type SummarizeDocumentOutput } from "@/ai/flows/summarize-document";
import { generateQuiz, type GenerateQuizOutput } from "@/ai/flows/generate-quiz";
import { generateCustomQuiz } from "@/ai/flows/generate-custom-quiz";

import SummaryDisplay from "./SummaryDisplay";
import QuizDisplay from "./QuizDisplay";
import DownloadStudyAidsButton from "./DownloadStudyAidsButton";

import * as pdfjsLib from 'pdfjs-dist';

const PDFJS_WORKER_SRC = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.mjs`;

export default function StudySmartsPage() {
  const { currentUser, setTeacherQuizData, teacherQuizData, studentAttempts, clearTeacherQuizData } = useStudyContext();
  const [documentName, setDocumentName] = useState<string | null>(null);
  const [documentText, setDocumentText] = useState<string>("");
  const [isFileUploaded, setIsFileUploaded] = useState<boolean>(false);
  const [isPdfProcessing, setIsPdfProcessing] = useState<boolean>(false);

  const [summary, setSummary] = useState<SummarizeDocumentOutput | null>(null);
  const [quiz, setQuiz] = useState<GenerateQuizOutput | null>(null);
  
  const [isLoadingSummary, setIsLoadingSummary] = useState<boolean>(false);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [customQuizTopic, setCustomQuizTopic] = useState<string>("");
  const [customNumQuestions, setCustomNumQuestions] = useState<number>(10);
  const [isCustomQuizModeActive, setIsCustomQuizModeActive] = useState<boolean>(false); 

  const [scrollToQuizSignal, setScrollToQuizSignal] = useState<boolean>(false);
  const quizSectionRef = useRef<HTMLDivElement>(null);

  const { toast } = useToast();

  useEffect(() => {
    pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_SRC;
  }, []);
  
  useEffect(() => {
    if (currentUser?.role === 'teacher') {
      if (teacherQuizData) {
        setSummary(teacherQuizData.summary);
        setQuiz(teacherQuizData.quiz);
        setDocumentName(teacherQuizData.documentName);
        const isTeacherDataCustom = teacherQuizData.documentName.toLowerCase().startsWith("custom quiz:");
        setIsCustomQuizModeActive(isTeacherDataCustom);
        if (isTeacherDataCustom) {
            setCustomQuizTopic(teacherQuizData.documentName.replace(/^Custom Quiz:\s*/i, ""));
        } else {
            setCustomQuizTopic(""); // Clear custom topic if loaded data is document-based
        }
      } else {
         // If teacher is logged in but no quiz data in context/localStorage, clear local component state
         // unless custom quiz mode is being actively worked on.
         if (!isCustomQuizModeActive && !documentText && !customQuizTopic) {
            setSummary(null);
            setQuiz(null);
            setDocumentName(null);
        }
      }
    } else if (!currentUser) { 
        // For guests, if custom quiz mode was active, keep custom topic.
        // If not in custom quiz mode, retain document info.
        // This logic path is mainly for retaining guest's current work.
    }
    // Student role doesn't directly interact with this page's state in this effect
  }, [currentUser, teacherQuizData]); // Removed isCustomQuizModeActive, documentText, customQuizTopic from deps as they are managed within this effect or by user actions.


  useEffect(() => {
    if (scrollToQuizSignal && quizSectionRef.current) {
      quizSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setScrollToQuizSignal(false);
    }
  }, [scrollToQuizSignal]);

  const resetDocumentState = () => {
    setDocumentName(null);
    setDocumentText("");
    setIsFileUploaded(false);
    setError(null);
    // Only reset summary/quiz if not a teacher with active quiz data or not currently in custom quiz mode.
    if (!(currentUser?.role === 'teacher' && teacherQuizData) && !isCustomQuizModeActive) {
        setSummary(null);
        setQuiz(null);
    }
  }

  const prepareForCustomQuizGeneration = () => {
    if (!isCustomQuizModeActive) { // Only clear if switching TO custom quiz mode
        setError(null);
        setSummary(null); 
        setQuiz(null);    
        setDocumentName(null);
        setDocumentText("");
        setIsFileUploaded(false);
    }
    setIsCustomQuizModeActive(true);
  }

  const prepareForDocumentProcessing = () => {
    if (isCustomQuizModeActive) { // Only clear if switching FROM custom quiz mode
      setCustomQuizTopic("");
      setError(null);
      // Do not clear summary/quiz if there's teacher data, let that persist.
      // If no teacher data, then clear.
      if (!(currentUser?.role === 'teacher' && teacherQuizData)) {
        setSummary(null);
        setQuiz(null);
      }
    }
    setIsCustomQuizModeActive(false);
  }


  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    prepareForDocumentProcessing(); // Set mode to document, clear custom quiz topic
    resetDocumentState(); // Reset specific document states

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
            fullText += pageText + "\n";
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
        setDocumentText(""); // Ensure this is cleared for unsupported files
        setError("Unsupported file. Please upload PDF/text or paste content.");
        toast({ variant: "default", title: "Unsupported File", description: "Upload PDF/text or paste."});
      }
    } else {
      resetDocumentState();
    }
  };

  const handleGenerateDocumentAids = async (event: FormEvent) => {
    event.preventDefault();
    if (isCustomQuizModeActive) { // Should not happen if UI is disabled correctly, but as a safeguard.
        toast({variant: "default", title: "Mode Conflict", description: "Switch to document processing mode first."});
        return;
    }
    if (!documentText.trim() && !isPdfProcessing) {
      setError("Document content is empty.");
      toast({ variant: "destructive", title: "Empty Content", description: "Please provide document content." });
      return;
    }
    if (isPdfProcessing) return; // Don't allow generation while PDF is still being processed.

    setError(null);
    setSummary(null); // Clear previous summary
    setQuiz(null);    // Clear previous quiz
    setIsLoadingSummary(true);
    setIsLoadingQuiz(false); // Will be set to true after summary
    const currentDocName = documentName || "Uploaded Document"; // Use existing documentName or a default
    setDocumentName(currentDocName); // Ensure documentName state is set for current operation

    try {
      const summaryResult = await summarizeDocument({ documentText });
      setSummary(summaryResult);
      toast({ title: "Summary Generated" });
      setIsLoadingSummary(false);

      setIsLoadingQuiz(true);
      try {
        const quizResult = await generateQuiz({ summary: summaryResult.summary });
        setQuiz(quizResult);
        setScrollToQuizSignal(true);
        toast({ title: "Quiz Generated" });

        // If the current user is a teacher, set this as the active quiz for students
        if (currentUser?.role === 'teacher') {
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
      setIsLoadingQuiz(false); // Ensure this is also false if summary fails
    }
  };

  const handleGenerateCustomQuiz = async (event: FormEvent) => {
    event.preventDefault();
    if (!isCustomQuizModeActive){ // Should not happen if UI disabled, but safeguard
        toast({variant: "default", title: "Mode Conflict", description: "Activate custom quiz mode first (by typing a topic).."});
        return;
    }
    if (!customQuizTopic.trim()) {
      setError("Custom quiz topic cannot be empty.");
      toast({ variant: "destructive", title: "Empty Topic", description: "Please provide a topic." });
      return;
    }
    
    setError(null);
    setSummary(null); // Clear previous summary (if any, e.g., from document mode)
    setQuiz(null);    // Clear previous quiz
    setIsLoadingQuiz(true);
    setIsLoadingSummary(false); // Not generating a detailed summary here
    
    const tempDocName = `Custom Quiz: ${customQuizTopic}`;
    setDocumentName(tempDocName); // Set document name for custom quiz context

    try {
      const customQuizResult = await generateCustomQuiz({ topic: customQuizTopic, numQuestions: customNumQuestions });
      // Create a placeholder summary for custom quizzes
      const placeholderSummary: SummarizeDocumentOutput = { 
        summary: `This quiz is based on the topic: "${customQuizTopic}". No detailed document summary is available.`, 
        sectionSummaries: undefined 
      };
      setQuiz(customQuizResult); 
      setSummary(placeholderSummary);  // Set the placeholder summary
      setScrollToQuizSignal(true);
      toast({ title: "Custom Quiz Generated", description: `Quiz for "${customQuizTopic}" is ready.` });

      // If the current user is a teacher, set this as the active quiz for students
      if (currentUser?.role === 'teacher') {
         setTeacherQuizData({ summary: placeholderSummary, quiz: customQuizResult, documentName: tempDocName });
      }

    } catch (customQuizError: any) {
      setError("Failed to generate custom quiz: " + (customQuizError.message || "Unknown error"));
      toast({ variant: "destructive", title: "Custom Quiz Failed", description: "Generation failed."});
    } finally {
      setIsLoadingQuiz(false);
    }
  };

  const handleClearActiveQuiz = () => {
    if (currentUser?.role === 'teacher') {
        clearTeacherQuizData();
        // Reset local component state to reflect no active quiz
        setSummary(null);
        setQuiz(null);
        setDocumentName(null);
        setIsCustomQuizModeActive(false); // Revert to default mode
        setCustomQuizTopic("");
        // Also clear document-related states if they were populated
        setDocumentText("");
        setIsFileUploaded(false);
    }
  };

  // Handler for when SummaryDisplay's content changes (if editable)
  const handleSummaryChange = (newSummary: SummarizeDocumentOutput) => {
    setSummary(newSummary); 
    // If teacher is logged in and a quiz and documentName exist, update teacherQuizData
    if (currentUser?.role === 'teacher' && quiz && documentName) { // Use local documentName
        setTeacherQuizData({summary: newSummary, quiz, documentName});
    }
  };

  // Handler for when QuizDisplay's content changes (if editable)
  const handleQuizChange = (newQuiz: GenerateQuizOutput) => {
    setQuiz(newQuiz); 
     // If teacher is logged in and a summary and documentName exist, update teacherQuizData
     if (currentUser?.role === 'teacher' && summary && documentName) { // Use local documentName
        setTeacherQuizData({summary, quiz: newQuiz, documentName});
    }
  };
  
  const totalLoadingProgress = () => {
    if (isPdfProcessing && !isCustomQuizModeActive) return 15;
    if (isLoadingSummary && !summary && !isCustomQuizModeActive) return 30; // Only show summary progress if it's for a document
    if (isLoadingQuiz) return 75; // Quiz loading applies to both modes
    // Completion state
    if ((summary && quiz && !isCustomQuizModeActive) || (quiz && isCustomQuizModeActive && summary /*placeholder summary*/)) return 100;
    return 0;
  }

  // Determine effective content based on context or local state
  // Prioritize teacherQuizData if teacher is logged in and it exists
  const effectiveSummary = currentUser?.role === 'teacher' && teacherQuizData ? teacherQuizData.summary : summary;
  const effectiveQuiz = currentUser?.role === 'teacher' && teacherQuizData ? teacherQuizData.quiz : quiz;
  const effectiveDocumentName = currentUser?.role === 'teacher' && teacherQuizData 
      ? teacherQuizData.documentName 
      : isCustomQuizModeActive && customQuizTopic 
          ? `Custom Quiz: ${customQuizTopic}` 
          : documentName;
  
  // Determine if the effective mode is custom quiz based on the effectiveDocumentName or local custom mode state
  const effectiveIsCustomQuizMode = effectiveDocumentName?.toLowerCase().startsWith("custom quiz:") ?? isCustomQuizModeActive;


  // Filter student attempts relevant to the currently active teacher quiz
  const relevantStudentAttempts = studentAttempts.filter(
    attempt => teacherQuizData && attempt.quizName === teacherQuizData.documentName
  );

  const isTeacherOnline = currentUser?.role === 'teacher';
  const isStudentOnline = currentUser?.role === 'student';
  const isGuestOnline = !currentUser;


  // If a student is logged in, they should be redirected or shown a message to go to their page.
  // This main page is primarily for guests or teachers.
  if (isStudentOnline) { 
    return (
        <main className="w-full max-w-4xl space-y-6 p-4 md:p-8 mt-4 mx-auto">
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center"><UserCircle className="mr-2 h-6 w-6 text-primary" /> Student Portal Access</CardTitle>
                    <CardDescription>
                        Welcome, {currentUser.id}! If not redirected, please use the "Student" link in the navbar to access your quiz.
                    </CardDescription>
                </CardHeader>
                 <CardContent>
                    <p>Your assigned quiz is available on the Student page.</p>
                </CardContent>
            </Card>
        </main>
    )
  }


  return (
    <div className="min-h-[calc(100vh-var(--navbar-height,60px))] flex flex-col items-center">
      {/* Main content area */}
      <main className="w-full max-w-4xl space-y-6 p-4 md:p-8 mt-4">
        {/* Teacher Mode Alert */}
        { isTeacherOnline && (
             <Alert variant="default" className="bg-primary/10 border-primary/30 dark:bg-primary/20 dark:border-primary/40">
                <Briefcase className="h-5 w-5 text-primary" />
                <AlertTitle className="text-primary font-semibold">Teacher Mode ({currentUser.id})</AlertTitle>
                <AlertDescription>
                    {teacherQuizData 
                        ? <>Currently active quiz for students: <strong>"{teacherQuizData.documentName}"</strong>. Any new quiz generated will replace this.</>
                        : 'You are in teacher mode. Generate a quiz from a document or topic to make it available for students.'}
                </AlertDescription>
                 {teacherQuizData && (
                    <Button onClick={handleClearActiveQuiz} variant="destructive" size="sm" className="mt-3">
                        <Trash2 className="mr-2 h-4 w-4" /> Clear Active Quiz for Students
                    </Button>
                 )}
            </Alert>
        )}

        {/* Custom Quiz Card */}
        <Card className="shadow-lg border border-purple-300 dark:border-purple-700">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Wand2 className="mr-2 h-6 w-6 text-purple-500" />
              1. Create Custom Quiz by Topic
            </CardTitle>
            <CardDescription>
              Enter a topic or phrase to generate a quiz.
              {isTeacherOnline && " This quiz will be set for students if generated."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGenerateCustomQuiz} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="custom-topic" className="text-sm font-medium">Enter Topic/Phrase</Label>
                <Input 
                  id="custom-topic" 
                  placeholder="e.g., 'The Solar System' or 'Photosynthesis'"
                  value={customQuizTopic}
                  onChange={(e) => {
                    setCustomQuizTopic(e.target.value);
                    if (e.target.value.trim() !== "") {
                        prepareForCustomQuizGeneration();
                    } else if (isCustomQuizModeActive && !effectiveQuiz) { // If cleared topic and was in custom mode without a quiz generated
                        setIsCustomQuizModeActive(false); // Revert mode if topic is cleared and no quiz is active from custom mode
                    }
                  }}
                  className="border-input focus:ring-purple-500"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Number of Questions</Label>
                <RadioGroup 
                  value={String(customNumQuestions)} 
                  onValueChange={(value) => {
                    setCustomNumQuestions(Number(value));
                    if(customQuizTopic.trim() !== "") prepareForCustomQuizGeneration(); // Ensure mode is set if topic exists
                  }} 
                  className="flex flex-wrap gap-x-4 gap-y-2"
                >
                  {[5, 10, 15, 20].map(num => (
                    <div key={num} className="flex items-center space-x-2">
                      <RadioGroupItem value={String(num)} id={`num-${num}`} />
                      <Label htmlFor={`num-${num}`} className="cursor-pointer">{num}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              <Button 
                type="submit" 
                className="w-full text-white font-semibold bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 hover:from-purple-600 hover:via-pink-600 hover:to-red-600 focus:ring-4 focus:outline-none focus:ring-pink-300 dark:focus:ring-pink-800 shadow-lg shadow-pink-500/50 dark:shadow-lg dark:shadow-pink-800/80 rounded-lg py-3 text-center transition-all duration-300 ease-in-out transform hover:scale-105"
                disabled={isLoadingQuiz || isPdfProcessing || isLoadingSummary || customQuizTopic.trim() === ""}
              >
                {isLoadingQuiz && isCustomQuizModeActive ? ( // Only show loader if it's for this button
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Wand2 className="mr-2 h-5 w-5" />
                )}
                Generate Custom Quiz
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Document Processing Card */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <UploadCloud className="mr-2 h-6 w-6 text-primary" />
              2. Process Document
            </CardTitle>
            <CardDescription>
              Alternatively, upload a PDF/text file for summary and quiz generation.
              {isTeacherOnline && " This quiz will be set for students if generated."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGenerateDocumentAids} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file-upload" className="text-sm font-medium">Select File (PDF or .txt, .md)</Label>
                <Input id="file-upload" type="file" accept=".pdf,text/plain,.txt,.md" onChange={handleFileChange} className="file:text-primary file:font-semibold"/>
                {isFileUploaded && !isCustomQuizModeActive && documentName && ( // Show only if not in custom mode
                  <p className="text-sm text-muted-foreground flex items-center mt-1">
                    <FileText size={16} className="mr-1" /> Selected: {documentName}
                    {isPdfProcessing && " (Extracting text...)"}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="document-text" className="text-sm font-medium">
                  Document Content {/* Label always visible */}
                </Label>
                <Textarea
                  id="document-text"
                  placeholder={
                    isPdfProcessing && !isCustomQuizModeActive
                      ? "Extracting text from PDF..." 
                      : isFileUploaded && documentText && !isCustomQuizModeActive // Text from file and not custom mode
                        ? "Text from uploaded file. You can edit it before generating aids."
                        : isCustomQuizModeActive // Custom mode is active
                          ? "Custom Quiz mode is active. This section is for document processing."
                          : "Paste document text here, or upload a file above." // Default placeholder
                  }
                  value={isCustomQuizModeActive ? "" : documentText} // Show empty if custom mode, otherwise doc text
                  onChange={(e) => {
                    setDocumentText(e.target.value);
                    if (e.target.value.trim() !== "" && isCustomQuizModeActive) { // If user types here while in custom mode
                        prepareForDocumentProcessing(); // Switch to document mode
                    }
                  }}
                  rows={8}
                  className="border-input focus:ring-primary"
                  readOnly={isPdfProcessing && !isCustomQuizModeActive} // Readonly if PDF processing for doc mode
                  disabled={isCustomQuizModeActive && !documentText} // Disabled if custom mode AND no doc text (to prevent accidental submission)
                />
                 {/* PDF Ready Alert - only if not in custom mode */}
                 {isFileUploaded && !isPdfProcessing && documentName?.endsWith('.pdf') && documentText && !error && !isCustomQuizModeActive && (
                    <Alert variant="default" className="mt-2 bg-green-50 border-green-300 dark:bg-green-900/30 dark:border-green-700">
                        <Info className="h-4 w-4 text-green-700 dark:text-green-400" />
                        <AlertTitle className="text-green-700 dark:text-green-400">PDF Ready</AlertTitle>
                        <AlertDescription className="text-green-700 dark:text-green-400">
                            PDF text extracted. You can edit it or generate study aids.
                        </AlertDescription>
                    </Alert>
                )}
                 {/* PDF Processing Alert - only if not in custom mode */}
                 {isFileUploaded && isPdfProcessing && !isCustomQuizModeActive && (
                    <Alert variant="default" className="mt-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <AlertTitle>PDF Processing</AlertTitle>
                        <AlertDescription>Extracting text from PDF...</AlertDescription>
                    </Alert>
                )}
              </div>
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={isLoadingSummary || isLoadingQuiz || isPdfProcessing || isCustomQuizModeActive || (documentText.trim() === "" && !isPdfProcessing)}
              >
                {(isLoadingSummary || (isLoadingQuiz && !isCustomQuizModeActive && !isPdfProcessing && !isCustomQuizModeActive)) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {(isPdfProcessing && !isCustomQuizModeActive) ? 'Processing File...' : 'Generate Study Aids from Document'}
              </Button>
            </form>
          </CardContent>
        </Card>
        
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="my-4">
              <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Loading Progress Bar */}
        {(isLoadingSummary || isLoadingQuiz || (isPdfProcessing && !isCustomQuizModeActive)) && (
          <Card className="shadow-lg mt-6">
            <CardHeader>
              <CardTitle>Processing...</CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={totalLoadingProgress()} className="w-full" />
              <p className="text-center text-muted-foreground mt-2">
                {isPdfProcessing && !isCustomQuizModeActive ? "Extracting text from PDF..." : ""}
                {isLoadingSummary && !summary && !isCustomQuizModeActive ? " Generating summary..." : ""}
                {isLoadingQuiz && !isPdfProcessing ? " Generating quiz..." : ""}
              </p>
            </CardContent>
          </Card>
        )}
        
        {/* Display Area for Summary and Quiz */}
        <div ref={quizSectionRef}>
            {/* Display summary only if it exists and either not in custom mode OR it's the placeholder for custom mode */}
            {effectiveSummary && !isLoadingSummary && (!isCustomQuizModeActive || effectiveIsCustomQuizMode) && (
              <SummaryDisplay 
                summary={effectiveSummary} 
                onSummaryChange={handleSummaryChange} 
                isLoading={isLoadingSummary}
                isEditable={isTeacherOnline || isGuestOnline} // Guests and teachers can edit
              />
            )}

            {/* Display quiz if it exists, a summary (even placeholder) exists, and not loading */}
            {/* And user is a teacher or guest */}
            {effectiveQuiz && effectiveSummary && !isLoadingQuiz && (isTeacherOnline || isGuestOnline) && (
              <div className="mt-6">
                <QuizDisplay 
                  quiz={effectiveQuiz} 
                  onQuizChange={handleQuizChange} 
                  isLoading={isLoadingQuiz}
                  documentSummary={effectiveSummary.summary} // Pass summary for hints
                  documentName={effectiveDocumentName || undefined} // Pass doc name for title
                  isEditable={isTeacherOnline || isGuestOnline} // Guests and teachers can edit
                />
              </div>
            )}
        </div>
        
        {/* Download Button - only if content exists and user is teacher or guest */}
        {(effectiveSummary && effectiveQuiz && !isLoadingSummary && !isLoadingQuiz) && (isTeacherOnline || isGuestOnline) && (
          <DownloadStudyAidsButton 
            summary={effectiveSummary} 
            quiz={effectiveQuiz} 
            documentName={effectiveDocumentName}
            isCustomQuiz={effectiveIsCustomQuizMode}
          />
        )}

        {/* Student Attempts Table - only for logged-in teachers with active quiz data */}
        {isTeacherOnline && teacherQuizData && teacherQuizData.documentName && (
          <Card className="shadow-lg mt-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-6 w-6 text-primary" />
                Student Attempts for "{teacherQuizData.documentName}"
              </CardTitle>
              <CardDescription>
                Scores of students who have taken this quiz. Student attempt data is cleared on page reload or when a new quiz is set by the teacher.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {relevantStudentAttempts.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student ID</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {relevantStudentAttempts.map((attempt, index) => (
                      <TableRow key={index}>
                        <TableCell>{attempt.studentId}</TableCell>
                        <TableCell>{attempt.score} / {attempt.totalQuestions}</TableCell>
                        <TableCell>{new Date(attempt.timestamp).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground">No student attempts recorded for this quiz yet.</p>
              )}
            </CardContent>
          </Card>
        )}
      </main>
      <footer className="w-full max-w-4xl mt-12 text-center p-4">
        <p className="text-sm text-muted-foreground">Made by Priyanshu, Ritik & Tushar</p>
        <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} StudySmarts. All rights reserved.</p>
      </footer>
    </div>
  );
}
