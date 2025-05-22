
"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useState, useEffect } from "react";
import { BookOpenText, FileText, UploadCloud, Loader2, Info, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

import { summarizeDocument, type SummarizeDocumentOutput } from "@/ai/flows/summarize-document";
import { generateQuiz, type GenerateQuizOutput } from "@/ai/flows/generate-quiz";

import SummaryDisplay from "./SummaryDisplay";
import QuizDisplay from "./QuizDisplay";
import DownloadStudyAidsButton from "./DownloadStudyAidsButton";

import * as pdfjsLib from 'pdfjs-dist';

// Set workerSrc for pdfjs-dist. This tells pdf.js where to load its worker script from.
// Using a CDN version. Ensure the version matches the installed pdfjs-dist version.
// You can find the installed version in package.json.
// For example, if "pdfjs-dist": "^4.4.168", use that version in the URL.
const PDFJS_VERSION = pdfjsLib.version; // Gets the version from the imported library
const PDFJS_WORKER_SRC = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.mjs`;


export default function StudySmartsPage() {
  const [documentName, setDocumentName] = useState<string | null>(null);
  const [documentText, setDocumentText] = useState<string>("");
  const [isFileUploaded, setIsFileUploaded] = useState<boolean>(false); // Tracks if any file is selected
  const [isPdfProcessing, setIsPdfProcessing] = useState<boolean>(false); // Tracks if PDF processing is ongoing

  const [summary, setSummary] = useState<SummarizeDocumentOutput | null>(null);
  const [quiz, setQuiz] = useState<GenerateQuizOutput | null>(null);
  
  const [isLoadingSummary, setIsLoadingSummary] = useState<boolean>(false);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_SRC;
  }, []);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setDocumentName(file.name);
      setIsFileUploaded(true);
      setError(null);
      setDocumentText(""); // Clear previous text
      setSummary(null); // Clear previous summary
      setQuiz(null); // Clear previous quiz

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
          setDocumentText(""); // Clear text if PDF processing fails
        } finally {
          setIsPdfProcessing(false);
        }
      } else if (file.type.startsWith("text/")) {
         // Handle plain text files
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
      setDocumentName(null);
      setDocumentText("");
      setIsFileUploaded(false);
      setError(null);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!documentText.trim() && !isPdfProcessing) { // Only show error if not currently processing a PDF
      setError("Document content cannot be empty. Please upload a file or paste text.");
      toast({
        variant: "destructive",
        title: "Empty Content",
        description: "Please provide document content.",
      });
      return;
    }
    if (isPdfProcessing) {
      setError("Please wait for the PDF processing to complete.");
      toast({
        title: "Processing PDF",
        description: "Please wait for text extraction to finish before generating study aids.",
      });
      return;
    }

    setError(null);
    setSummary(null);
    setQuiz(null);

    setIsLoadingSummary(true);
    try {
      const summaryResult = await summarizeDocument({ documentText });
      setSummary(summaryResult);
      toast({
        title: "Summarization Complete",
        description: "Document summary has been generated.",
      });
      setIsLoadingSummary(false);

      setIsLoadingQuiz(true);
      try {
        const quizResult = await generateQuiz({ summary: summaryResult.summary });
        setQuiz(quizResult);
        toast({
          title: "Quiz Generation Complete",
          description: "Quiz has been generated based on the summary.",
        });
      } catch (quizError) {
        console.error("Quiz generation error:", quizError);
        setError("Failed to generate quiz. " + (quizError instanceof Error ? quizError.message : String(quizError)));
        toast({
          variant: "destructive",
          title: "Quiz Generation Failed",
          description: "Could not generate the quiz.",
        });
      } finally {
        setIsLoadingQuiz(false);
      }
    } catch (summaryError) {
      console.error("Summarization error:", summaryError);
      setError("Failed to summarize document. " + (summaryError instanceof Error ? summaryError.message : String(summaryError)));
      toast({
        variant: "destructive",
        title: "Summarization Failed",
        description: "Could not summarize the document.",
      });
      setIsLoadingSummary(false);
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
    if (isLoadingSummary && !summary) return 25 + (isPdfProcessing ? 10 : 0) ; // Summarizing
    if (isLoadingSummary && summary && isLoadingQuiz) return 50 + (isPdfProcessing ? 10 : 0); // Summarized, starting quiz
    if (!isLoadingSummary && summary && isLoadingQuiz) return 75 + (isPdfProcessing ? 10 : 0); // Generating quiz
    if (!isLoadingSummary && !isLoadingQuiz && summary && quiz) return 100; // Done
    return 0;
  }

  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-8 bg-background">
      <header className="w-full max-w-4xl mb-8 text-center">
        <div className="flex items-center justify-center mb-2">
          <BookOpenText size={48} className="text-primary mr-3" />
          <h1 className="text-4xl font-bold text-foreground">StudySmarts</h1>
        </div>
        <p className="text-muted-foreground">
          Upload your PDF or text file, or paste content. Get AI summaries & quizzes!
        </p>
      </header>

      <main className="w-full max-w-4xl space-y-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <UploadCloud className="mr-2 h-6 w-6 text-primary" />
              Upload Document &amp; Add Content
            </CardTitle>
            <CardDescription>
              Select a PDF or text file for automatic text extraction, or paste content manually.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="file-upload" className="text-sm font-medium text-foreground">Select File (PDF or .txt, .md)</label>
                <Input id="file-upload" type="file" accept=".pdf,text/plain,.txt,.md" onChange={handleFileChange} className="file:text-primary file:font-semibold"/>
                {documentName && (
                  <p className="text-sm text-muted-foreground flex items-center mt-1">
                    <FileText size={16} className="mr-1" /> Selected file: {documentName}
                    {isPdfProcessing && " (Processing...)"}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label htmlFor="document-text" className="text-sm font-medium text-foreground">
                  Document Content
                </label>
                <Textarea
                  id="document-text"
                  placeholder={
                    isPdfProcessing 
                      ? "Extracting text from PDF..." 
                      : isFileUploaded && documentText
                        ? "Text from uploaded file."
                        : "Paste the text content of your document here, or upload a file."
                  }
                  value={documentText}
                  onChange={(e) => {
                    setDocumentText(e.target.value);
                    // If user types, assume they are no longer relying on file upload for content
                    // or want to override/add to it.
                    // setIsFileUploaded(false); // Or handle this based on desired UX
                  }}
                  rows={10}
                  className="border-input focus:ring-primary"
                  readOnly={isPdfProcessing} 
                  aria-readonly={isPdfProcessing}
                />
                 {isFileUploaded && !isPdfProcessing && documentName?.endsWith('.pdf') && !documentText && !error && (
                    <Alert variant="default" className="mt-2">
                        <Info className="h-4 w-4" />
                        <AlertTitle>PDF Ready</AlertTitle>
                        <AlertDescription>
                            PDF text has been extracted. You can now generate study aids or edit the text below if needed.
                        </AlertDescription>
                    </Alert>
                )}
                 {isFileUploaded && isPdfProcessing && (
                    <Alert variant="default" className="mt-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <AlertTitle>PDF Processing</AlertTitle>
                        <AlertDescription>
                            Extracting text from the PDF. This may take a moment.
                        </AlertDescription>
                    </Alert>
                )}
              </div>
              {error && (
                <Alert variant="destructive">
                   <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={isLoadingSummary || isLoadingQuiz || isPdfProcessing}
              >
                {(isLoadingSummary || isLoadingQuiz || isPdfProcessing) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {(isPdfProcessing) ? 'Processing File...' : 'Generate Study Aids'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {(isLoadingSummary || isLoadingQuiz || isPdfProcessing) && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Processing...</CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={totalLoadingProgress()} className="w-full" />
              <p className="text-center text-muted-foreground mt-2">
                {isPdfProcessing ? "Extracting text from PDF..." : ""}
                {isLoadingSummary && !summary && !isPdfProcessing ? "Generating summary..." : ""}
                {summary && isLoadingQuiz && !isPdfProcessing ? "Generating quiz..." : ""}
              </p>
            </CardContent>
          </Card>
        )}

        {summary && !isLoadingSummary && (
          <SummaryDisplay 
            summary={summary} 
            onSummaryChange={handleSummaryChange} 
            isLoading={isLoadingSummary}
          />
        )}

        {quiz && summary && !isLoadingQuiz && ( // Ensure summary is available for hints
          <QuizDisplay 
            quiz={quiz} 
            onQuizChange={handleQuizChange} 
            isLoading={isLoadingQuiz}
            documentSummary={summary.summary} // Pass summary for hints
          />
        )}
        
        {summary && quiz && !isLoadingSummary && !isLoadingQuiz && (
          <DownloadStudyAidsButton 
            summary={summary} 
            quiz={quiz} 
            documentName={documentName || "StudyAids"}
          />
        )}
      </main>
      <footer className="w-full max-w-4xl mt-12 text-center">
        <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} StudySmarts. All rights reserved.</p>
      </footer>
    </div>
  );
}
