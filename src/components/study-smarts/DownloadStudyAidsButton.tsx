
"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { SummarizeDocumentOutput } from "@/ai/flows/summarize-document";
import type { GenerateQuizOutput } from "@/ai/flows/generate-quiz";
import jsPDF from 'jspdf';

interface DownloadStudyAidsButtonProps {
  summary: SummarizeDocumentOutput; // For custom quizzes, this will contain a placeholder summary
  quiz: GenerateQuizOutput;
  documentName: string;
  isCustomQuiz?: boolean;
}

export default function DownloadStudyAidsButton({ summary, quiz, documentName, isCustomQuiz = false }: DownloadStudyAidsButtonProps) {
  const { toast } = useToast();

  const handleDownload = () => {
    toast({
      title: "Generating PDF...",
      description: `Preparing your study aids for "${documentName}".`,
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
      const title = isCustomQuiz ? `Custom Quiz: ${documentName.replace("Custom Quiz: ", "")}` : `Study Aids for: ${documentName}`;
      yPosition = addTextWithBreaks(title, margin, yPosition, {fontSize: 18});
      yPosition += 10;

      // Summary Section - only if not a custom quiz or if summary has substantial content
      if (!isCustomQuiz && summary.summary) {
        doc.setFontSize(16);
        yPosition = addTextWithBreaks("SUMMARY", margin, yPosition, {fontSize: 16});
        yPosition += 5;
        doc.setFontSize(11);
        yPosition = addTextWithBreaks(summary.summary, margin, yPosition, {fontSize: 11});
        yPosition += 7;

        if (summary.sectionSummaries) {
          doc.setFontSize(14);
          yPosition = addTextWithBreaks("Section Summaries:", margin, yPosition, {fontSize: 14});
          yPosition += 5;
          doc.setFontSize(11);
          yPosition = addTextWithBreaks(summary.sectionSummaries, margin, yPosition, {fontSize: 11});
          yPosition += 7;
        }
      } else if (isCustomQuiz && summary.summary) {
        // For custom quiz, we might have a placeholder summary like "Quiz about TOPIC"
        // Let's skip it in PDF if it's just a placeholder, or display if it was more substantial.
        // For now, we assume it's a placeholder and skip it.
      }


      // Quiz Section
      if (yPosition > pageHeight - 40) { 
          doc.addPage();
          yPosition = 15;
      }
      doc.setFontSize(16);
      yPosition = addTextWithBreaks("QUIZ", margin, yPosition, {fontSize: 16});
      yPosition += 7;

      quiz.questions.forEach((q, i) => {
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

      const pdfFileName = `${documentName.replace(/[:/\\]/g, "_").replace(/\.[^/.]+$/, "") || "StudyAids"}_Quiz.pdf`;
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
        description: "An error occurred while trying to generate the PDF. Please try again.",
        duration: 5000,
      });
    }
  };

  return (
    <Button 
        onClick={handleDownload} 
        className="w-full mt-6 bg-accent hover:bg-accent/90 text-accent-foreground"
        aria-label="Download study aids as PDF"
    >
      <Download className="mr-2 h-5 w-5" />
      Download {isCustomQuiz ? "Quiz" : "Summary & Quiz"} as PDF
    </Button>
  );
}

