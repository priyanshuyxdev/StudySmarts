
"use client";

import type { SummarizeDocumentOutput } from "@/ai/flows/summarize-document";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Lightbulb, Edit3, ChevronsUpDown, ArrowDownToLine, Maximize, Minimize } from "lucide-react";
import { useState } from "react";

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
  const [isExpanded, setIsExpanded] = useState(false);

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

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
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
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center"><Lightbulb className="mr-2 h-6 w-6 text-primary" /> Document Summary</CardTitle>
          <CardDescription>
            {isEditable ? "Review and edit the generated summary below." : "Review the generated summary below."}
          </CardDescription>
        </div>
        <Button onClick={toggleExpand} variant="outline" size="sm">
          {isExpanded ? <Minimize className="mr-2 h-4 w-4" /> : <Maximize className="mr-2 h-4 w-4" />}
          {isExpanded ? "Collapse" : "Expand"}
        </Button>
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
            rows={isExpanded ? 20 : (isEditable ? 8 : 6)}
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
                  rows={isExpanded ? 15 : (isEditable ? 10 : 8)}
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
