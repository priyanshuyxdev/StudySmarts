
"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useState } from "react";
import { BookOpenText, FileText, UploadCloud, Loader2, Info } from "lucide-react";
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

// NOTE: For actual PDF text extraction, a library like pdf.js (Mozilla) would be needed for client-side processing,
// or a backend service for server-side processing. This implementation simulates extraction.

const SIMULATED_PDF_TEXT_TEMPLATE = (fileName: string) => `Content from ${fileName}:

This document provides a comprehensive overview of modern software development practices. Key topics include Agile methodologies, DevOps principles, version control with Git, continuous integration and continuous deployment (CI/CD) pipelines, and the importance of automated testing. It also delves into popular architectural patterns like microservices and serverless computing, highlighting their benefits and drawbacks. 

Furthermore, the document emphasizes the significance of code quality, maintainability, and collaboration in software projects. Several case studies are presented to illustrate these concepts in real-world scenarios. The final sections explore emerging trends such as AI-assisted development and low-code/no-code platforms, offering insights into the future of software engineering. This content is detailed enough to generate a comprehensive summary and a quiz with multiple questions.
`;

export default function StudySmartsPage() {
  const [documentName, setDocumentName] = useState<string | null>(null);
  const [documentText, setDocumentText] = useState<string>("");
  const [isPdfUploaded, setIsPdfUploaded] = useState<boolean>(false);
  const [summary, setSummary] = useState<SummarizeDocumentOutput | null>(null);
  const [quiz, setQuiz] = useState<GenerateQuizOutput | null>(null);
  
  const [isLoadingSummary, setIsLoadingSummary] = useState<boolean>(false);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { toast } = useToast();

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === "application/pdf") {
        setDocumentName(file.name);
        // Simulate PDF text extraction
        setDocumentText(SIMULATED_PDF_TEXT_TEMPLATE(file.name));
        setIsPdfUploaded(true);
        setError(null);
        toast({
          title: "PDF Processed (Simulated)",
          description: `Text has been simulated for "${file.name}". The content is ready for summarization.`,
        });
      } else {
        setDocumentName(file.name); // Keep name for non-PDFs if user still wants to paste
        setDocumentText(""); // Clear text area for manual paste
        setIsPdfUploaded(false);
        setError("Non-PDF file selected. Please paste its content below or select a PDF for automatic (simulated) extraction.");
        toast({
          variant: "default", // Not destructive, just informational
          title: "Non-PDF File Selected",
          description: "Please paste content manually or upload a PDF.",
        });
      }
    } else {
      // Reset if no file is selected (e.g., user clears file input)
      setDocumentName(null);
      setDocumentText("");
      setIsPdfUploaded(false);
      setError(null);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!documentText.trim()) {
      setError("Document content cannot be empty. Please upload a PDF or paste text.");
      toast({
        variant: "destructive",
        title: "Empty Content",
        description: "Please provide document content.",
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
    if (isLoadingSummary && !summary) return 25; // Summarizing
    if (isLoadingSummary && summary && isLoadingQuiz) return 50; // Summarized, starting quiz
    if (!isLoadingSummary && summary && isLoadingQuiz) return 75; // Generating quiz
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
          Upload PDF for (simulated) auto-extraction, or paste text. Get AI summaries & quizzes!
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
              Select a PDF for (simulated) automatic text extraction. For other file types, please paste the content manually.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="pdf-upload" className="text-sm font-medium text-foreground">Select File (PDF recommended)</label>
                <Input id="pdf-upload" type="file" accept=".pdf,text/plain,.txt,.md" onChange={handleFileChange} className="file:text-primary file:font-semibold"/>
                {documentName && (
                  <p className="text-sm text-muted-foreground flex items-center mt-1">
                    <FileText size={16} className="mr-1" /> Selected file: {documentName}
                    {isPdfUploaded && " (Text auto-populated below)"}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label htmlFor="document-text" className="text-sm font-medium text-foreground">
                  {isPdfUploaded ? "Document Content (from PDF - read-only)" : "Paste Document Content"}
                </label>
                <Textarea
                  id="document-text"
                  placeholder={isPdfUploaded ? "Text from PDF is shown here." : "Paste the text content of your document here..."}
                  value={documentText}
                  onChange={(e) => setDocumentText(e.target.value)}
                  rows={10}
                  className="border-input focus:ring-primary"
                  readOnly={isPdfUploaded}
                  aria-readonly={isPdfUploaded}
                />
                 {isPdfUploaded && (
                    <Alert variant="default" className="mt-2">
                        <Info className="h-4 w-4" />
                        <AlertTitle>PDF Text Simulated</AlertTitle>
                        <AlertDescription>
                            The text above is a simulation of PDF extraction. For a full application, a PDF parsing library (e.g., pdf.js) would be integrated.
                        </AlertDescription>
                    </Alert>
                )}
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={isLoadingSummary || isLoadingQuiz}
              >
                {(isLoadingSummary || isLoadingQuiz) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate Study Aids
              </Button>
            </form>
          </CardContent>
        </Card>

        {(isLoadingSummary || isLoadingQuiz) && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Processing...</CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={totalLoadingProgress()} className="w-full" />
              <p className="text-center text-muted-foreground mt-2">
                {isLoadingSummary && !summary ? "Generating summary..." : ""}
                {summary && isLoadingQuiz ? "Generating quiz..." : ""}
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

        {quiz && !isLoadingQuiz && (
          <QuizDisplay 
            quiz={quiz} 
            onQuizChange={handleQuizChange} 
            isLoading={isLoadingQuiz}
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
