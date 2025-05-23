
"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useState, useEffect, useRef } from "react";
import { BookOpenText, FileText, UploadCloud, Loader2, Info, AlertTriangle, Wand2, HelpCircle, UserCircle } from "lucide-react";
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

import { summarizeDocument, type SummarizeDocumentOutput } from "@/ai/flows/summarize-document";
import { generateQuiz, type GenerateQuizOutput } from "@/ai/flows/generate-quiz";
import { generateCustomQuiz, type GenerateCustomQuizInput } from "@/ai/flows/generate-custom-quiz";

import SummaryDisplay from "./SummaryDisplay";
import QuizDisplay from "./QuizDisplay";
import DownloadStudyAidsButton from "./DownloadStudyAidsButton";

import * as pdfjsLib from 'pdfjs-dist';

const PDFJS_WORKER_SRC = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.mjs`;

export default function StudySmartsPage() {
  const { currentUser, setTeacherQuizData, teacherQuizData } = useStudyContext();
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
  const [isCustomQuizModeActive, setIsCustomQuizModeActive] = useState<boolean>(false); // True if actively working on custom quiz

  const [scrollToQuizSignal, setScrollToQuizSignal] = useState<boolean>(false);
  const quizSectionRef = useRef<HTMLDivElement>(null);

  const { toast } = useToast();

  useEffect(() => {
    pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_SRC;
  }, []);
  
  // Effect to load teacher's quiz if they are logged in and navigate to home
  useEffect(() => {
    if (currentUser?.role === 'teacher' && teacherQuizData) {
        setSummary(teacherQuizData.summary);
        setQuiz(teacherQuizData.quiz);
        setDocumentName(teacherQuizData.documentName);
        setIsCustomQuizModeActive(false); // Teacher uses document processing
    } else if (currentUser?.role !== 'teacher') {
        // If not a teacher, or teacher has no quiz data, clear local state unless it's a custom quiz being built
        if (!isCustomQuizModeActive) {
            // setSummary(null); // Keep local summary/quiz if user is working on one as guest
            // setQuiz(null);
            // setDocumentName(null);
        }
    }
  }, [currentUser, teacherQuizData, isCustomQuizModeActive]);


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
    // Only reset summary/quiz if not loading teacher's quiz
    if (!(currentUser?.role === 'teacher' && teacherQuizData)) {
        setSummary(null);
        setQuiz(null);
    }
    setIsCustomQuizModeActive(false);
  }

  const prepareForCustomQuizGeneration = () => {
    if (!isCustomQuizModeActive) {
        setError(null);
        setSummary(null); 
        setQuiz(null);    
        setIsCustomQuizModeActive(true);
        setDocumentName(null);
        setDocumentText("");
        setIsFileUploaded(false);
    }
  }

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    resetDocumentState(); 
    setIsCustomQuizModeActive(false); 
    setCustomQuizTopic("");

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
    if (!documentText.trim() && !isPdfProcessing) {
      setError("Document content is empty.");
      toast({ variant: "destructive", title: "Empty Content", description: "Please provide document content." });
      return;
    }
    if (isPdfProcessing) return;

    setError(null);
    setSummary(null);
    setQuiz(null);
    setIsCustomQuizModeActive(false); 
    setCustomQuizTopic(""); 
    setIsLoadingSummary(true);
    setIsLoadingQuiz(false);

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

        if (currentUser?.role === 'teacher' && documentName) {
          setTeacherQuizData({ summary: summaryResult, quiz: quizResult, documentName });
        }
      } catch (quizError: any) {
        setError("Failed to generate quiz: " + quizError.message);
        toast({ variant: "destructive", title: "Quiz Error", description: "Quiz generation failed."});
      } finally {
        setIsLoadingQuiz(false);
      }
    } catch (summaryError: any) {
      setError("Failed to summarize: " + summaryError.message);
      toast({ variant: "destructive", title: "Summary Error", description: "Summarization failed."});
      setIsLoadingSummary(false);
      setIsLoadingQuiz(false);
    }
  };

  const handleGenerateCustomQuiz = async (event: FormEvent) => {
    event.preventDefault();
    if (!customQuizTopic.trim()) {
      setError("Custom quiz topic cannot be empty.");
      toast({ variant: "destructive", title: "Empty Topic", description: "Please provide a topic." });
      return;
    }
    
    prepareForCustomQuizGeneration(); 
    setError(null);
    setIsLoadingQuiz(true);
    setIsLoadingSummary(false);
    
    const tempDocName = `Custom Quiz: ${customQuizTopic}`;
    setDocumentName(tempDocName);

    try {
      const customQuizResult = await generateCustomQuiz({ topic: customQuizTopic, numQuestions: customNumQuestions });
      const placeholderSummary: SummarizeDocumentOutput = { 
        summary: `This quiz is based on the topic: "${customQuizTopic}". Hints will reference general knowledge.`, 
        sectionSummaries: undefined 
      };
      setQuiz(customQuizResult);
      setSummary(placeholderSummary);
      setScrollToQuizSignal(true);
      toast({ title: "Custom Quiz Generated", description: `Quiz for "${customQuizTopic}" is ready.` });

      // Teachers generating custom quiz does not set it as the "official" student quiz
      // Only document-based quizzes from teachers are set for students for now.
      // If teachers should be able to set custom quizzes for students, this logic would change.

    } catch (customQuizError: any) {
      setError("Failed to generate custom quiz: " + customQuizError.message);
      toast({ variant: "destructive", title: "Custom Quiz Failed", description: "Generation failed."});
    } finally {
      setIsLoadingQuiz(false);
    }
  };

  const handleSummaryChange = (newSummary: SummarizeDocumentOutput) => {
    setSummary(newSummary);
    if (currentUser?.role === 'teacher' && quiz && documentName) {
        setTeacherQuizData({summary: newSummary, quiz, documentName});
    }
  };

  const handleQuizChange = (newQuiz: GenerateQuizOutput) => {
    setQuiz(newQuiz);
     if (currentUser?.role === 'teacher' && summary && documentName) {
        setTeacherQuizData({summary, quiz: newQuiz, documentName});
    }
  };
  
  const totalLoadingProgress = () => {
    if (isPdfProcessing) return 15;
    if (isLoadingSummary && !summary && !isCustomQuizModeActive) return 30;
    if (isLoadingQuiz) return 75;
    if ((summary && quiz && !isCustomQuizModeActive) || (quiz && isCustomQuizModeActive)) return 100;
    return 0;
  }

  const isTeacherViewingOwnQuiz = currentUser?.role === 'teacher' && quiz && summary;
  const isGuestViewingQuiz = !currentUser && quiz && summary;


  if (currentUser?.role === 'student') {
    return (
        <main className="w-full max-w-4xl space-y-6 p-4 md:p-8 mt-4 mx-auto">
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center"><UserCircle className="mr-2 h-6 w-6 text-primary" /> Student Portal</CardTitle>
                    <CardDescription>
                        Welcome, {currentUser.id}! Please navigate to the "Student" link in the navbar to take your assigned quiz.
                    </CardDescription>
                </CardHeader>
                 <CardContent>
                    <p>If there's a quiz assigned by your teacher, it will be available on the Student page.</p>
                </CardContent>
            </Card>
        </main>
    )
  }


  return (
    <div className="min-h-[calc(100vh-var(--navbar-height,60px))] flex flex-col items-center">
      {/* Header removed as Navbar is now in RootLayout */}
      <main className="w-full max-w-4xl space-y-6 p-4 md:p-8 mt-4">
        { currentUser?.role === 'teacher' && (
             <Alert variant="default" className="bg-primary/10 border-primary/30">
                <Briefcase className="h-5 w-5 text-primary" />
                <AlertTitle className="text-primary font-semibold">Teacher Mode Activated</AlertTitle>
                <AlertDescription>
                    You are logged in as a teacher. Quizzes generated from "Process Document" will be made available to students.
                    Custom quizzes generated here are for your review only and won't be set for students automatically.
                </AlertDescription>
            </Alert>
        )}

        <Card className="shadow-lg border border-purple-300 dark:border-purple-700">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Wand2 className="mr-2 h-6 w-6 text-purple-500" />
              1. Create Custom Quiz by Topic
            </CardTitle>
            <CardDescription>
              Enter a topic or phrase to generate a quiz without uploading a document.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGenerateCustomQuiz} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="custom-topic" className="text-sm font-medium text-foreground">Enter Topic/Phrase</Label>
                <Input 
                  id="custom-topic" 
                  placeholder="e.g., 'The Solar System' or 'Photosynthesis'"
                  value={customQuizTopic}
                  onChange={(e) => {
                    setCustomQuizTopic(e.target.value);
                    if (e.target.value.trim() !== "" && !isCustomQuizModeActive) {
                        prepareForCustomQuizGeneration();
                    }
                  }}
                  className="border-input focus:ring-purple-500"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">Number of Questions</Label>
                <RadioGroup 
                  value={String(customNumQuestions)} 
                  onValueChange={(value) => {
                    setCustomNumQuestions(Number(value));
                    if(!isCustomQuizModeActive) prepareForCustomQuizGeneration();
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
                className="w-full text-white font-semibold bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-pink-300 dark:focus:ring-pink-800 shadow-lg shadow-pink-500/50 dark:shadow-lg dark:shadow-pink-800/80 rounded-lg py-3 text-center transition-all duration-300 ease-in-out transform hover:scale-105"
                disabled={isLoadingQuiz || isPdfProcessing || isLoadingSummary}
              >
                {isLoadingQuiz && isCustomQuizModeActive ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Wand2 className="mr-2 h-5 w-5" />
                )}
                Generate Custom Quiz
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <UploadCloud className="mr-2 h-6 w-6 text-primary" />
              2. Process Document {currentUser?.role === 'teacher' && "(Quiz will be set for students)"}
            </CardTitle>
            <CardDescription>
              Alternatively, upload a PDF/text file for summary and quiz generation based on its content. Or paste content directly.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGenerateDocumentAids} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file-upload" className="text-sm font-medium text-foreground">Select File (PDF or .txt, .md)</Label>
                <Input id="file-upload" type="file" accept=".pdf,text/plain,.txt,.md" onChange={handleFileChange} className="file:text-primary file:font-semibold"/>
                {documentName && !isCustomQuizModeActive && (
                  <p className="text-sm text-muted-foreground flex items-center mt-1">
                    <FileText size={16} className="mr-1" /> Selected: {documentName}
                    {isPdfProcessing && " (Extracting text...)"}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="document-text" className="text-sm font-medium text-foreground">
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
                    if (isCustomQuizModeActive) { 
                        setIsCustomQuizModeActive(false);
                        setCustomQuizTopic(""); 
                    }
                  }}
                  rows={8}
                  className="border-input focus:ring-primary"
                  readOnly={isPdfProcessing && !isCustomQuizModeActive}
                  disabled={isCustomQuizModeActive}
                />
                 {isFileUploaded && !isPdfProcessing && documentName?.endsWith('.pdf') && documentText && !error && !isCustomQuizModeActive && (
                    <Alert variant="default" className="mt-2 bg-green-50 border-green-300 dark:bg-green-900/30 dark:border-green-700">
                        <Info className="h-4 w-4 text-green-700 dark:text-green-400" />
                        <AlertTitle className="text-green-700 dark:text-green-400">PDF Ready</AlertTitle>
                        <AlertDescription className="text-green-700 dark:text-green-400">
                            PDF text extracted. You can edit it or generate study aids.
                        </AlertDescription>
                    </Alert>
                )}
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
                {(isLoadingSummary || (isLoadingQuiz && !isCustomQuizModeActive && !isPdfProcessing)) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {(isPdfProcessing && !isCustomQuizModeActive) ? 'Processing File...' : 'Generate Study Aids from Document'}
              </Button>
            </form>
          </CardContent>
        </Card>
        
        {error && (
          <Alert variant="destructive" className="my-4">
              <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

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
        
        <div ref={quizSectionRef}>
            {summary && !isLoadingSummary && !isCustomQuizModeActive && (isTeacherViewingOwnQuiz || isGuestViewingQuiz) && (
              <SummaryDisplay 
                summary={summary} 
                onSummaryChange={handleSummaryChange} 
                isLoading={isLoadingSummary}
                isEditable={currentUser?.role === 'teacher' || !currentUser} // Editable for teacher or guest
              />
            )}
             {summary && !isLoadingSummary && isCustomQuizModeActive && (isGuestViewingQuiz || (currentUser?.role === 'teacher' && isCustomQuizModeActive)) && ( // Custom quiz summary view
              <SummaryDisplay 
                summary={summary} 
                onSummaryChange={handleSummaryChange} 
                isLoading={isLoadingSummary}
                isEditable={currentUser?.role === 'teacher' || !currentUser} // Custom quiz summary also editable for creator
              />
            )}


            {quiz && summary && !isLoadingQuiz && (isTeacherViewingOwnQuiz || isGuestViewingQuiz || isCustomQuizModeActive) && (
              <div className="mt-6">
                 <CardHeader className="px-0 pt-0 mb-2">
                    <CardTitle className="flex items-center text-xl md:text-2xl">
                        <HelpCircle className="mr-2 h-6 w-6 md:h-7 md:w-7 text-primary" /> 
                        {isCustomQuizModeActive ? `Quiz on "${customQuizTopic}"` : "Quiz from Document"}
                    </CardTitle>
                 </CardHeader>
                <QuizDisplay 
                  quiz={quiz} 
                  onQuizChange={handleQuizChange} 
                  isLoading={isLoadingQuiz}
                  documentSummary={summary.summary}
                  isEditable={currentUser?.role === 'teacher' || !currentUser} // Editable for teacher or guest
                />
              </div>
            )}
        </div>
        
        {(summary && quiz && !isLoadingSummary && !isLoadingQuiz) && (isTeacherViewingOwnQuiz || isGuestViewingQuiz || isCustomQuizModeActive) && (
          <DownloadStudyAidsButton 
            summary={summary} 
            quiz={quiz} 
            documentName={documentName || (isCustomQuizModeActive && customQuizTopic ? `Custom Quiz - ${customQuizTopic}` : "StudyAids")}
            isCustomQuiz={isCustomQuizModeActive}
          />
        )}
      </main>
      <footer className="w-full max-w-4xl mt-12 text-center p-4">
        <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} StudySmarts. All rights reserved.</p>
      </footer>
    </div>
  );
}
