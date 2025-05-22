"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useState } from "react";
import { BookOpenText, FileText, UploadCloud, Loader2 } from "lucide-react";
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

export default function StudySmartsPage() {
  const [documentName, setDocumentName] = useState<string | null>(null);
  const [documentText, setDocumentText] = useState<string>("");
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
        setError(null);
        // Actual PDF text extraction would happen here.
        // For now, user needs to paste text. We can clear existing text or prompt.
        // setDocumentText(""); // Optionally clear text area
        toast({
          title: "File Selected",
          description: `${file.name} selected. Please paste its content below.`,
        });
      } else {
        setDocumentName(null);
        setError("Invalid file type. Please upload a PDF.");
        toast({
          variant: "destructive",
          title: "Invalid File",
          description: "Please upload a PDF file.",
        });
      }
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!documentText.trim()) {
      setError("Document content cannot be empty.");
      toast({
        variant: "destructive",
        title: "Empty Content",
        description: "Please paste the document content.",
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
          Upload your documents, get AI-powered summaries and quizzes to boost your learning!
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
              Select your PDF document, then paste its content into the text area below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="pdf-upload" className="text-sm font-medium text-foreground">Select PDF File</label>
                <Input id="pdf-upload" type="file" accept=".pdf" onChange={handleFileChange} className="file:text-primary file:font-semibold"/>
                {documentName && (
                  <p className="text-sm text-muted-foreground flex items-center mt-1">
                    <FileText size={16} className="mr-1" /> Selected file: {documentName}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label htmlFor="document-text" className="text-sm font-medium text-foreground">Paste Document Content</label>
                <Textarea
                  id="document-text"
                  placeholder="Paste the text content of your document here..."
                  value={documentText}
                  onChange={(e) => setDocumentText(e.target.value)}
                  rows={10}
                  className="border-input focus:ring-primary"
                />
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
