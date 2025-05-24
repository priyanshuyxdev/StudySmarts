
"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { SummarizeDocumentOutput } from "@/ai/flows/summarize-document";
import type { GenerateQuizOutput } from "@/ai/flows/generate-quiz";
import jsPDF from 'jspdf';
import { useStudyContext } from "@/context/StudyContext";

interface DownloadStudyAidsButtonProps {
  summary: SummarizeDocumentOutput | null;
  quiz: GenerateQuizOutput | null;
  documentName: string | null;
  isCustomQuiz?: boolean;
  downloadType: 'summary' | 'full';
}

export default function DownloadStudyAidsButton({
  summary: propSummary,
  quiz: propQuiz,
  documentName: propDocumentName,
  isCustomQuiz = false,
  downloadType,
}: DownloadStudyAidsButtonProps) {
  const { toast } = useToast();
  const { currentUser, teacherQuizData } = useStudyContext();

  const summaryToUse = currentUser?.role === 'student' && teacherQuizData ? teacherQuizData.summary : propSummary;
  const quizToUse = currentUser?.role === 'student' && teacherQuizData ? teacherQuizData.quiz : propQuiz;
  const documentNameToUse = currentUser?.role === 'student' && teacherQuizData
    ? teacherQuizData.documentName
    : (propDocumentName || (isCustomQuiz ? "Custom Quiz" : "Study Aids"));

  const isCustomQuizEffective = currentUser?.role === 'student' && teacherQuizData
    ? teacherQuizData.documentName.toLowerCase().startsWith("custom quiz:")
    : isCustomQuiz;

  const handleDownload = () => {
    const contentAvailable = (downloadType === 'summary' && summaryToUse && !isCustomQuizEffective) ||
                             (downloadType === 'full' && ((summaryToUse && !isCustomQuizEffective) || quizToUse));

    if (!contentAvailable || !documentNameToUse) {
      toast({
        variant: "destructive",
        title: "Missing Data",
        description: "Cannot generate PDF due to missing content or document name.",
      });
      return;
    }

    toast({
      title: "Generating PDF...",
      description: `Preparing ${downloadType === 'summary' ? 'summary' : 'study aids'} for "${documentNameToUse}". This may take a moment.`,
    });

    try {
      const doc = new jsPDF();
      let yPosition = 15;
      const pageHeight = doc.internal.pageSize.height;
      const pageWidth = doc.internal.pageSize.width;
      const margin = 15;
      const maxLineWidth = pageWidth - margin * 2;

      const addWrappedText = (text: string, x: number, currentY: number, options?: any): number => {
        doc.setFontSize(options?.fontSize || 11);
        const lines = doc.splitTextToSize(text, maxLineWidth);
        const lineHeight = doc.getFontSize() * (options?.lineHeightFactor || 1.15) / doc.internal.scaleFactor ;

        let spaceNeeded = lines.length * lineHeight + (options?.marginBottom || 0);
        if (currentY + spaceNeeded > pageHeight - margin) {
          doc.addPage();
          currentY = margin;
        }
        doc.text(lines, x, currentY, options);
        return currentY + spaceNeeded;
      };
      
      let pdfTitle = "";
      if (downloadType === 'summary') {
        pdfTitle = `Summary for: ${documentNameToUse.replace(/^Custom Quiz:\s*/i, "")}`;
      } else { 
        pdfTitle = documentNameToUse.startsWith("Custom Quiz: ")
          ? documentNameToUse
          : `Study Aids for: ${documentNameToUse}`;
      }
      yPosition = addWrappedText(pdfTitle, margin, yPosition, { fontSize: 18, marginBottom: 10 });


      if ((downloadType === 'summary' || downloadType === 'full') && summaryToUse?.summary && !isCustomQuizEffective) {
        yPosition = addWrappedText("SUMMARY", margin, yPosition, { fontSize: 16, marginBottom: 5 });
        yPosition = addWrappedText(summaryToUse.summary, margin, yPosition, { fontSize: 11, marginBottom: 7 });

        if (summaryToUse.sectionSummaries) {
          yPosition = addWrappedText("Section Summaries:", margin, yPosition, { fontSize: 14, marginBottom: 5 });
          yPosition = addWrappedText(summaryToUse.sectionSummaries, margin, yPosition, { fontSize: 11, marginBottom: 7 });
        }
      }

      if (downloadType === 'full' && quizToUse) {
        if (yPosition + 25 > pageHeight - margin) { 
            doc.addPage();
            yPosition = margin;
        }
        yPosition = addWrappedText("QUIZ", margin, yPosition, { fontSize: 16, marginBottom: 7 });

        quizToUse.questions.forEach((q, i) => {
          yPosition = addWrappedText(`Q${i + 1}: ${q.question}`, margin, yPosition, { fontSize: 12, marginBottom: 2 });
          
          q.options.forEach((opt, oIdx) => {
            yPosition = addWrappedText(`  ${String.fromCharCode(97 + oIdx)}) ${opt}`, margin + 5, yPosition, { fontSize: 11, marginBottom: 1 });
          });
          yPosition += 2; 

          // Only include reason if not a student or if student download is explicitly allowed to have reasons (not current case)
          if (currentUser?.role !== 'student') {
            yPosition = addWrappedText(`Reason for correct answer: ${q.reason}`, margin, yPosition, { fontSize: 11, marginBottom: 8 });
          } else {
             yPosition += 6; // Add some spacing even if reason is omitted for students
          }
        });
      }

      const safeDocumentName = documentNameToUse.replace(/[:/\\]/g, "_").replace(/\.[^/.]+$/, "");
      const pdfFileName = `${downloadType === 'summary' ? 'Summary' : 'StudyAids'}_${safeDocumentName || "Generated"}.pdf`;
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

  let buttonLabel = "";
  let isButtonDisabled = false;

  if (downloadType === 'summary') {
    buttonLabel = "Download Summary as PDF";
    isButtonDisabled = !summaryToUse || isCustomQuizEffective; 
  } else { 
    buttonLabel = `Download ${isCustomQuizEffective ? "Quiz" : "Summary & Quiz"} as PDF`;
    isButtonDisabled = ((!summaryToUse && !isCustomQuizEffective) || !quizToUse || !documentNameToUse);
  }


  return (
    <Button
      onClick={handleDownload}
      className="w-full mt-6 bg-accent hover:bg-accent/90 text-accent-foreground"
      aria-label={buttonLabel}
      disabled={isButtonDisabled}
    >
      <Download className="mr-2 h-5 w-5" />
      {buttonLabel}
    </Button>
  );
}

    