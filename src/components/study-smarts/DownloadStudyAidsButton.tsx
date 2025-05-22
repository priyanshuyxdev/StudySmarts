"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { SummarizeDocumentOutput } from "@/ai/flows/summarize-document";
import type { GenerateQuizOutput } from "@/ai/flows/generate-quiz";

interface DownloadStudyAidsButtonProps {
  summary: SummarizeDocumentOutput;
  quiz: GenerateQuizOutput;
  documentName: string;
}

export default function DownloadStudyAidsButton({ summary, quiz, documentName }: DownloadStudyAidsButtonProps) {
  const { toast } = useToast();

  const handleDownload = () => {
    // Placeholder for actual PDF generation logic
    console.log("Downloading summary and quiz for:", documentName);
    console.log("Summary:", summary);
    console.log("Quiz:", quiz);
    
    toast({
      title: "Download Initiated (Placeholder)",
      description: `PDF generation for "${documentName}" will be implemented here.`,
    });

    // Example of what might be generated (plain text for now)
    let content = `Document: ${documentName}\n\n`;
    content += "SUMMARY\n";
    content += "=======\n";
    content += summary.summary + "\n\n";
    if (summary.sectionSummaries) {
      content += "Section Summaries:\n";
      content += summary.sectionSummaries + "\n\n";
    }
    content += "QUIZ\n";
    content += "====\n";
    quiz.questions.forEach((q, i) => {
      content += `Q${i+1}: ${q.question}\n`;
      q.options.forEach((opt, oIdx) => {
        content += `  ${String.fromCharCode(97 + oIdx)}) ${opt}\n`;
      });
      content += `Answer: ${q.answer}\n\n`;
    });

    // Simulate file download
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${documentName.replace('.pdf', '')}_StudyAids.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  return (
    <Button 
        onClick={handleDownload} 
        className="w-full mt-6 bg-accent hover:bg-accent/90 text-accent-foreground"
        aria-label="Download summary and quiz"
    >
      <Download className="mr-2 h-5 w-5" />
      Download Summary & Quiz
    </Button>
  );
}
