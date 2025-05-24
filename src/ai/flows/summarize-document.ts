'use server';

/**
 * @fileOverview An AI agent that summarizes documents.
 *
 * - summarizeDocument - A function that summarizes a document.
 * - SummarizeDocumentInput - The input type for the summarizeDocument function.
 * - SummarizeDocumentOutput - The return type for the summarizeDocument function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummaryLengthEnum = z.enum(['brief', 'medium', 'detailed']).describe("The desired length of the summary.");
export type SummaryLength = z.infer<typeof SummaryLengthEnum>;

const SummarizeDocumentInputSchema = z.object({
  documentText: z.string().describe('The text content of the document to summarize.'),
  summaryLength: SummaryLengthEnum.optional().describe("Optional: Desired length for the main summary: 'brief', 'medium', or 'detailed'."),
  summaryFocus: z.string().optional().describe("Optional: A specific topic or keyword to focus on in the summary."),
});
export type SummarizeDocumentInput = z.infer<typeof SummarizeDocumentInputSchema>;

const SummarizeDocumentOutputSchema = z.object({
  summary: z.string().describe('A detailed and comprehensive summary of the document, potentially using bullet points for clarity.'),
  sectionSummaries: z.string().optional().describe('Section by section summaries of the document, if applicable, also detailed and with bullet points.'),
});
export type SummarizeDocumentOutput = z.infer<typeof SummarizeDocumentOutputSchema>;

export async function summarizeDocument(input: SummarizeDocumentInput): Promise<SummarizeDocumentOutput> {
  return summarizeDocumentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeDocumentPrompt',
  input: {schema: SummarizeDocumentInputSchema},
  output: {schema: SummarizeDocumentOutputSchema},
  prompt: `You are an expert summarizer. Please provide a summary of the following document.
Where appropriate, use **bullet points** to list key information, steps, or components described in the document.
Ensure the summary is comprehensive and captures the main arguments, findings, and conclusions.

{{#if summaryLength}}
Please make the main summary '{{summaryLength}}' in length.
{{else}}
Please make the main summary 'medium' in length (provide a good balance of detail and conciseness).
{{/if}}

{{#if summaryFocus}}
Pay special attention to and emphasize "{{summaryFocus}}" in your summary.
{{/if}}

Document:
{{{documentText}}}

Additionally, if the document is sufficiently long (more than 500 words or multiple distinct sections), provide a section-by-section summary of the document as well, also using detailed explanations and bullet points where suitable.
`,
});

const summarizeDocumentFlow = ai.defineFlow(
  {
    name: 'summarizeDocumentFlow',
    inputSchema: SummarizeDocumentInputSchema,
    outputSchema: SummarizeDocumentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
