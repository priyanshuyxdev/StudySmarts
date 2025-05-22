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
}

export default function SummaryDisplay({ summary, onSummaryChange, isLoading }: SummaryDisplayProps) {
  const handleMainSummaryChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onSummaryChange({
      ...summary,
      summary: e.target.value,
    });
  };

  // Editing section summaries is more complex, for now, they are read-only display
  // or could be a single textarea if that's how it's structured.
  // The current AI flow returns sectionSummaries as a single string.
  const handleSectionSummariesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
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
        <CardDescription>Review and edit the generated summary below.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label htmlFor="main-summary" className="text-sm font-medium flex items-center mb-1">
            <Edit3 size={16} className="mr-2 text-accent" />
            Main Summary
          </label>
          <Textarea
            id="main-summary"
            value={summary.summary}
            onChange={handleMainSummaryChange}
            rows={8}
            className="border-input focus:ring-primary"
            aria-label="Main summary text area"
          />
        </div>

        {summary.sectionSummaries && (
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="section-summaries">
              <AccordionTrigger className="text-sm font-medium flex items-center hover:no-underline">
                <Edit3 size={16} className="mr-2 text-accent" />
                Section-by-Section Summaries (Editable)
              </AccordionTrigger>
              <AccordionContent>
                <Textarea
                  id="section-summaries"
                  value={summary.sectionSummaries}
                  onChange={handleSectionSummariesChange}
                  rows={10}
                  className="border-input focus:ring-primary mt-2"
                  aria-label="Section summaries text area"
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}
