
"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { SummarizeDocumentOutput } from "@/ai/flows/summarize-document";
import type { GenerateQuizOutput } from "@/ai/flows/generate-quiz";
import jsPDF from 'jspdf';
import { useStudyContext } from "@/context/StudyContext"; // Import context

interface DownloadStudyAidsButtonProps {
  summary: SummarizeDocumentOutput | null; 
  quiz: GenerateQuizOutput | null;
  documentName: string | null;
  isCustomQuiz?: boolean;
}

export default function DownloadStudyAidsButton({ summary: propSummary, quiz: propQuiz, documentName: propDocumentName, isCustomQuiz = false }: DownloadStudyAidsButtonProps) {
  const { toast } = useToast();
  const { currentUser, teacherQuizData } = useStudyContext(); // Get context data

  // Determine which data to use: props or context (for student downloading teacher's quiz)
  const summaryToUse = currentUser?.role === 'student' && teacherQuizData ? teacherQuizData.summary : propSummary;
  const quizToUse = currentUser?.role === 'student' && teacherQuizData ? teacherQuizData.quiz : propQuiz;
  const documentNameToUse = currentUser?.role === 'student' && teacherQuizData ? teacherQuizData.documentName : propDocumentName;
  const isCustomQuizEffective = currentUser?.role === 'student' && teacherQuizData 
    ? teacherQuizData.documentName.toLowerCase().startsWith("custom quiz:") 
    : isCustomQuiz;


  const handleDownload = () => {
    if (!summaryToUse || !quizToUse || !documentNameToUse) {
      toast({
        variant: "destructive",
        title: "Missing Data",
        description: "Cannot generate PDF due to missing summary, quiz, or document name.",
      });
      return;
    }

    toast({
      title: "Generating PDF...",
      description: `Preparing study aids for "${documentNameToUse}".`,
    });

    try {
      const doc = new jsPDF();
      let yPosition = 15;
      const pageHeight = doc.internal.pageSize.height;
      const pageWidth = doc.internal.pageSize.width;
      const margin = 15;
      const maxLineWidth = pageWidth - margin * 2;

      const addTextWithBreaks = (text: string, x: number, y: number, options?: any) => {
        const lines = doc.splitTextToSize(text, maxLineWidth);
        doc.text(lines, x, y, options);
        return y + (lines.length * (options?.fontSize ? options.fontSize * 0.35 : 7)); 
      };

      doc.setFontSize(18);
      const title = isCustomQuizEffective ? `Custom Quiz: ${documentNameToUse.replace(/^Custom Quiz:\s*/i, "")}` : `Study Aids for: ${documentNameToUse}`;
      yPosition = addTextWithBreaks(title, margin, yPosition, {fontSize: 18});
      yPosition += 10;

      if (!isCustomQuizEffective && summaryToUse.summary) {
        doc.setFontSize(16);
        yPosition = addTextWithBreaks("SUMMARY", margin, yPosition, {fontSize: 16});
        yPosition += 5;
        doc.setFontSize(11);
        yPosition = addTextWithBreaks(summaryToUse.summary, margin, yPosition, {fontSize: 11});
        yPosition += 7;

        if (summaryToUse.sectionSummaries) {
          doc.setFontSize(14);
          yPosition = addTextWithBreaks("Section Summaries:", margin, yPosition, {fontSize: 14});
          yPosition += 5;
          doc.setFontSize(11);
          yPosition = addTextWithBreaks(summaryToUse.sectionSummaries, margin, yPosition, {fontSize: 11});
          yPosition += 7;
        }
      }


      if (yPosition > pageHeight - 40) { 
          doc.addPage();
          yPosition = 15;
      }
      doc.setFontSize(16);
      yPosition = addTextWithBreaks("QUIZ", margin, yPosition, {fontSize: 16});
      yPosition += 7;

      quizToUse.questions.forEach((q, i) => {
        doc.setFontSize(12);
        const questionText = `Q${i+1}: ${q.question}`;
        
        const questionLines = doc.splitTextToSize(questionText, maxLineWidth);
        let optionsHeight = 0;
        q.options.forEach(opt => {
            optionsHeight += doc.splitTextToSize(opt, maxLineWidth - 5).length * 5;
        });
        const reasonLines = doc.splitTextToSize(`Reason: ${q.reason}`, maxLineWidth);
        const estimatedHeight = (questionLines.length * 5) + optionsHeight + (reasonLines.length * 5) + 10;

        if (yPosition + estimatedHeight > pageHeight - margin) {
            doc.addPage();
            yPosition = margin;
        }
        
        yPosition = addTextWithBreaks(questionText, margin, yPosition, {fontSize: 12});
        yPosition += 2;

        doc.setFontSize(11);
        q.options.forEach((opt, oIdx) => {
          yPosition = addTextWithBreaks(`  ${String.fromCharCode(97 + oIdx)}) ${opt}`, margin + 5, yPosition, {fontSize: 11});
          yPosition += 1;
        });
        yPosition += 2;
        yPosition = addTextWithBreaks(`Reason for correct answer: ${q.reason}`, margin, yPosition, {fontSize: 11});
        yPosition += 8;
      });

      const pdfFileName = `${documentNameToUse.replace(/[:/\\]/g, "_").replace(/\.[^/.]+$/, "") || "StudyAids"}_Quiz.pdf`;
      doc.save(pdfFileName);
      toast({
        title: "PDF Downloaded",
        description: `"${pdfFileName}" has been downloaded.`,
        duration: 5000,
      });

    } catch (error) {
      console.error("Failed to generate PDF:", error);
      toast({
        variant: "destructive",
        title: "PDF Generation Failed",
        description: "An error occurred. Please try again.",
        duration: 5000,
      });
    }
  };

  const isDisabled = !summaryToUse || !quizToUse || !documentNameToUse;

  return (
    <Button 
        onClick={handleDownload} 
        className="w-full mt-6 bg-accent hover:bg-accent/90 text-accent-foreground"
        aria-label="Download study aids as PDF"
        disabled={isDisabled}
    >
      <Download className="mr-2 h-5 w-5" />
      Download {isCustomQuizEffective ? "Quiz" : "Summary & Quiz"} as PDF
    </Button>
  );
}
