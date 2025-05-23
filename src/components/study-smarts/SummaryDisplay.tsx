
"use client";

import type { SummarizeDocumentOutput } from "@/ai/flows/summarize-document";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Lightbulb, Edit3 } from "lucide-react";

interface SummaryDisplayProps {
  summary: SummarizeDocumentOutput;
  onSummaryChange: (newSummary: SummarizeDocumentOutput) => void;
  isLoading: boolean;
  isEditable?: boolean; // New prop
}

export default function SummaryDisplay({ 
  summary, 
  onSummaryChange, 
  isLoading, 
  isEditable = true // Default to true for teacher/guest
}: SummaryDisplayProps) {
  const handleMainSummaryChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!isEditable) return;
    onSummaryChange({
      ...summary,
      summary: e.target.value,
    });
  };

  const handleSectionSummariesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!isEditable) return;
    onSummaryChange({
      ...summary,
      sectionSummaries: e.target.value,
    });
  };

  if (isLoading) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center"><Lightbulb className="mr-2 h-6 w-6 text-primary" /> Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-8 w-3/4 bg-muted rounded animate-pulse"></div>
            <div className="h-20 w-full bg-muted rounded animate-pulse"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center"><Lightbulb className="mr-2 h-6 w-6 text-primary" /> Document Summary</CardTitle>
        <CardDescription>
          {isEditable ? "Review and edit the generated summary below." : "Review the generated summary below."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label htmlFor="main-summary" className="text-sm font-medium flex items-center mb-1">
            {isEditable && <Edit3 size={16} className="mr-2 text-accent" />}
            Main Summary
          </label>
          <Textarea
            id="main-summary"
            value={summary.summary}
            onChange={handleMainSummaryChange}
            rows={isEditable ? 8 : 6} // Fewer rows if not editable
            className="border-input focus:ring-primary"
            aria-label="Main summary text area"
            readOnly={!isEditable}
          />
        </div>

        {summary.sectionSummaries && (
          <Accordion type="single" collapsible className="w-full" defaultValue={isEditable ? undefined : "section-summaries"}>
            <AccordionItem value="section-summaries">
              <AccordionTrigger className="text-sm font-medium flex items-center hover:no-underline">
                {isEditable && <Edit3 size={16} className="mr-2 text-accent" />}
                Section-by-Section Summaries {isEditable ? "(Editable)" : ""}
              </AccordionTrigger>
              <AccordionContent>
                <Textarea
                  id="section-summaries"
                  value={summary.sectionSummaries}
                  onChange={handleSectionSummariesChange}
                  rows={isEditable ? 10 : 8} // Fewer rows if not editable
                  className="border-input focus:ring-primary mt-2"
                  aria-label="Section summaries text area"
                  readOnly={!isEditable}
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}
