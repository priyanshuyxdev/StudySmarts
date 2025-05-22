
"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useState, useEffect } from "react";
import { BookOpenText, FileText, UploadCloud, Loader2, Info, AlertTriangle, Wand2, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

import { summarizeDocument, type SummarizeDocumentOutput } from "@/ai/flows/summarize-document";
import { generateQuiz, type GenerateQuizOutput } from "@/ai/flows/generate-quiz";
import { generateCustomQuiz, type GenerateCustomQuizInput, type GenerateCustomQuizOutput } from "@/ai/flows/generate-custom-quiz";


import SummaryDisplay from "./SummaryDisplay";
import QuizDisplay from "./QuizDisplay";
import DownloadStudyAidsButton from "./DownloadStudyAidsButton";

import * as pdfjsLib from 'pdfjs-dist';

const PDFJS_VERSION = pdfjsLib.version;
const PDFJS_WORKER_SRC = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.mjs`;


export default function StudySmartsPage() {
  const [documentName, setDocumentName] = useState<string | null>(null);
  const [documentText, setDocumentText] = useState<string>("");
  const [isFileUploaded, setIsFileUploaded] = useState<boolean>(false);
  const [isPdfProcessing, setIsPdfProcessing] = useState<boolean>(false);

  const [summary, setSummary] = useState<SummarizeDocumentOutput | null>(null);
  const [quiz, setQuiz] = useState<GenerateQuizOutput | null>(null);
  
  const [isLoadingSummary, setIsLoadingSummary] = useState<boolean>(false);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState<boolean>(false); // Used for both doc and custom quiz
  const [error, setError] = useState<string | null>(null);

  // Custom Quiz State
  const [customQuizTopic, setCustomQuizTopic] = useState<string>("");
  const [customNumQuestions, setCustomNumQuestions] = useState<number>(10);
  const [isCustomQuizMode, setIsCustomQuizMode] = useState<boolean>(false);


  const { toast } = useToast();

  useEffect(() => {
    pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_SRC;
  }, []);

  const resetDocumentState = () => {
    setDocumentName(null);
    setDocumentText("");
    setIsFileUploaded(false);
    setError(null);
    setSummary(null);
    setQuiz(null);
    setIsCustomQuizMode(false);
  }

  const resetCustomQuizState = () => {
    setCustomQuizTopic("");
    setCustomNumQuestions(10);
    setError(null);
    setSummary(null); // Clear summary if switching to custom quiz or vice-versa
    setQuiz(null);    // Clear quiz
    setIsCustomQuizMode(true);
  }

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    resetDocumentState(); // Reset states when a new file is chosen for document processing
    setIsCustomQuizMode(false); // Ensure we are not in custom quiz mode

    if (file) {
      setDocumentName(file.name);
      setIsFileUploaded(true);
      
      if (file.type === "application/pdf") {
        setIsPdfProcessing(true);
        toast({
          title: "Processing PDF...",
          description: `Extracting text from "${file.name}". Please wait.`,
        });
        try {
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          let fullText = "";
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            fullText += textContent.items.map((item: any) => item.str).join(" ") + "\n";
          }
          setDocumentText(fullText);
          toast({
            title: "PDF Processed Successfully",
            description: `Text extracted from "${file.name}". Ready for summarization.`,
          });
        } catch (pdfError: any) {
          console.error("PDF processing error:", pdfError);
          setError(`Failed to process PDF: ${pdfError.message || String(pdfError)}. Please try again or paste content manually.`);
          toast({
            variant: "destructive",
            title: "PDF Processing Failed",
            description: `Could not extract text from "${file.name}".`,
          });
          setDocumentText("");
        } finally {
          setIsPdfProcessing(false);
        }
      } else if (file.type.startsWith("text/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = e.target?.result as string;
          setDocumentText(text);
           toast({
            title: "Text File Loaded",
            description: `Content from "${file.name}" loaded. Ready for summarization.`,
          });
        };
        reader.onerror = (e) => {
          console.error("File reading error:", e);
          setError("Failed to read the text file.");
          toast({ variant: "destructive", title: "File Reading Error", description: "Could not read the selected text file."});
        }
        reader.readAsText(file);
      } else {
        setDocumentText(""); 
        setError("Unsupported file type. Please upload a PDF or a plain text file (.txt, .md), or paste content manually.");
        toast({
          variant: "default", 
          title: "Unsupported File Type",
          description: "Please upload PDF/text or paste content manually.",
        });
      }
    } else {
      resetDocumentState();
    }
  };

  const handleGenerateDocumentAids = async (event: FormEvent) => {
    event.preventDefault();
    if (!documentText.trim() && !isPdfProcessing) {
      setError("Document content cannot be empty. Please upload a file or paste text.");
      toast({ variant: "destructive", title: "Empty Content", description: "Please provide document content." });
      return;
    }
    if (isPdfProcessing) {
      setError("Please wait for the PDF processing to complete.");
      toast({ title: "Processing PDF", description: "Please wait for text extraction to finish." });
      return;
    }

    setError(null);
    setSummary(null);
    setQuiz(null);
    setIsCustomQuizMode(false);
    setIsLoadingSummary(true);

    try {
      const summaryResult = await summarizeDocument({ documentText });
      setSummary(summaryResult);
      toast({ title: "Summarization Complete", description: "Document summary has been generated." });
      setIsLoadingSummary(false);

      setIsLoadingQuiz(true);
      try {
        const quizResult = await generateQuiz({ summary: summaryResult.summary });
        setQuiz(quizResult);
        toast({ title: "Quiz Generation Complete", description: "Quiz has been generated based on the summary." });
      } catch (quizError) {
        console.error("Quiz generation error:", quizError);
        setError("Failed to generate quiz. " + (quizError instanceof Error ? quizError.message : String(quizError)));
        toast({ variant: "destructive", title: "Quiz Generation Failed", description: "Could not generate the quiz." });
      } finally {
        setIsLoadingQuiz(false);
      }
    } catch (summaryError) {
      console.error("Summarization error:", summaryError);
      setError("Failed to summarize document. " + (summaryError instanceof Error ? summaryError.message : String(summaryError)));
      toast({ variant: "destructive", title: "Summarization Failed", description: "Could not summarize the document." });
      setIsLoadingSummary(false);
    }
  };

  const handleGenerateCustomQuiz = async (event: FormEvent) => {
    event.preventDefault();
    if (!customQuizTopic.trim()) {
      setError("Custom quiz topic cannot be empty.");
      toast({ variant: "destructive", title: "Empty Topic", description: "Please provide a topic for the custom quiz." });
      return;
    }
    
    setError(null);
    setSummary(null);
    setQuiz(null);
    setIsCustomQuizMode(true);
    setIsLoadingQuiz(true);
    setDocumentName(`Custom Quiz: ${customQuizTopic}`); // For download button

    try {
      const customQuizResult = await generateCustomQuiz({ topic: customQuizTopic, numQuestions: customNumQuestions });
      setQuiz(customQuizResult);
      // Create a synthetic summary for custom quiz context
      setSummary({ 
        summary: `This quiz is based on the topic: "${customQuizTopic}". Hints will be generated based on general knowledge of this topic.`, 
        sectionSummaries: undefined 
      });
      toast({ title: "Custom Quiz Generated", description: `Quiz for "${customQuizTopic}" is ready.` });
    } catch (customQuizError) {
      console.error("Custom quiz generation error:", customQuizError);
      setError("Failed to generate custom quiz. " + (customQuizError instanceof Error ? customQuizError.message : String(customQuizError)));
      toast({ variant: "destructive", title: "Custom Quiz Failed", description: "Could not generate the custom quiz." });
    } finally {
      setIsLoadingQuiz(false);
    }
  };


  const handleSummaryChange = (newSummary: SummarizeDocumentOutput) => {
    setSummary(newSummary);
  };

  const handleQuizChange = (newQuiz: GenerateQuizOutput) => {
    setQuiz(newQuiz);
  };
  
  const totalLoadingProgress = () => {
    if (isPdfProcessing) return 15;
    if (isLoadingSummary && !summary && !isCustomQuizMode) return 30;
    if (isLoadingQuiz) return 75;
    if (summary && quiz) return 100;
    return 0;
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-background">
      <header className="w-full bg-card shadow-sm sticky top-0 z-50">
        <div className="container mx-auto py-3 md:py-4 flex flex-col items-center text-center">
          <div className="flex items-center justify-center">
            <BookOpenText size={32} className="text-primary mr-2 md:mr-3" />
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">StudySmarts</h1>
          </div>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            Your AI study assistant for summaries & quizzes!
          </p>
        </div>
      </header>

      <main className="w-full max-w-4xl space-y-6 p-4 md:p-8 mt-4">
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
                    if (!isCustomQuizMode) { 
                        resetCustomQuizState(); 
                        setCustomQuizTopic(e.target.value); 
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
                    if (!isCustomQuizMode) resetCustomQuizState();
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
                {isLoadingQuiz && isCustomQuizMode ? (
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
              2. Process Document
            </CardTitle>
            <CardDescription>
              Alternatively, upload a PDF/text file for summary and quiz generation based on its content.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGenerateDocumentAids} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="file-upload" className="text-sm font-medium text-foreground">Select File (PDF or .txt, .md)</label>
                <Input id="file-upload" type="file" accept=".pdf,text/plain,.txt,.md" onChange={handleFileChange} className="file:text-primary file:font-semibold"/>
                {documentName && !isCustomQuizMode && (
                  <p className="text-sm text-muted-foreground flex items-center mt-1">
                    <FileText size={16} className="mr-1" /> Selected: {documentName}
                    {isPdfProcessing && " (Processing...)"}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label htmlFor="document-text" className="text-sm font-medium text-foreground">
                  Document Content (from uploaded file or paste manually)
                </label>
                <Textarea
                  id="document-text"
                  placeholder={
                    isPdfProcessing 
                      ? "Extracting text from PDF..." 
                      : isFileUploaded && documentText && !isCustomQuizMode
                        ? "Text from uploaded file."
                        : "Paste document text here, or upload a file above."
                  }
                  value={isCustomQuizMode ? "" : documentText} // Clear if in custom quiz mode
                  onChange={(e) => {
                    setDocumentText(e.target.value);
                    if (isCustomQuizMode) setIsCustomQuizMode(false); // Switch back if user types here
                  }}
                  rows={8}
                  className="border-input focus:ring-primary"
                  readOnly={isPdfProcessing || isCustomQuizMode}
                  aria-readonly={isPdfProcessing || isCustomQuizMode}
                />
                 {isFileUploaded && !isPdfProcessing && documentName?.endsWith('.pdf') && !documentText && !error && !isCustomQuizMode && (
                    <Alert variant="default" className="mt-2">
                        <Info className="h-4 w-4" />
                        <AlertTitle>PDF Ready</AlertTitle>
                        <AlertDescription>
                            PDF text extracted. Generate study aids or edit text.
                        </AlertDescription>
                    </Alert>
                )}
                 {isFileUploaded && isPdfProcessing && !isCustomQuizMode && (
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
                disabled={isLoadingSummary || isLoadingQuiz || isPdfProcessing || isCustomQuizMode}
              >
                {(isLoadingSummary || (isLoadingQuiz && !isCustomQuizMode)) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {(isPdfProcessing && !isCustomQuizMode) ? 'Processing File...' : 'Generate Study Aids from Document'}
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

        {(isLoadingSummary || isLoadingQuiz || isPdfProcessing) && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Processing...</CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={totalLoadingProgress()} className="w-full" />
              <p className="text-center text-muted-foreground mt-2">
                {isPdfProcessing ? "Extracting text from PDF..." : ""}
                {isLoadingSummary && !summary && !isCustomQuizMode ? "Generating summary..." : ""}
                {isLoadingQuiz && !isPdfProcessing ? "Generating quiz..." : ""}
              </p>
            </CardContent>
          </Card>
        )}

        {summary && !isLoadingSummary && !isCustomQuizMode && (
          <SummaryDisplay 
            summary={summary} 
            onSummaryChange={handleSummaryChange} 
            isLoading={isLoadingSummary}
          />
        )}

        {quiz && summary && !isLoadingQuiz && (
          <div className="mt-6">
             <CardHeader className="px-0 pt-0 mb-2">
                <CardTitle className="flex items-center text-xl md:text-2xl">
                    <HelpCircle className="mr-2 h-6 w-6 md:h-7 md:w-7 text-primary" /> 
                    {isCustomQuizMode ? `Quiz on "${customQuizTopic}"` : "Quiz from Document"}
                </CardTitle>
             </CardHeader>
            <QuizDisplay 
              quiz={quiz} 
              onQuizChange={handleQuizChange} 
              isLoading={isLoadingQuiz}
              documentSummary={summary.summary} // Pass summary for hints
            />
          </div>
        )}
        
        {summary && quiz && !isLoadingSummary && !isLoadingQuiz && (
          <DownloadStudyAidsButton 
            summary={summary} 
            quiz={quiz} 
            documentName={documentName || (isCustomQuizMode ? `Custom Quiz - ${customQuizTopic}` : "StudyAids")}
            isCustomQuiz={isCustomQuizMode}
          />
        )}
      </main>
      <footer className="w-full max-w-4xl mt-12 text-center p-4">
        <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} StudySmarts. All rights reserved.</p>
      </footer>
    </div>
  );
}


    