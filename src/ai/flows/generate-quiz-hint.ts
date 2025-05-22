
'use server';
/**
 * @fileOverview Generates a hint for a specific quiz question.
 *
 * - generateQuizHint - A function that generates a hint.
 * - GenerateQuizHintInput - The input type for the generateQuizHint function.
 * - GenerateQuizHintOutput - The return type for the generateQuizHint function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateQuizHintInputSchema = z.object({
  questionText: z.string().describe('The text of the quiz question for which a hint is needed.'),
  documentSummary: z.string().describe('The summary of the document, to provide context for the hint.'),
});
export type GenerateQuizHintInput = z.infer<typeof GenerateQuizHintInputSchema>;

const GenerateQuizHintOutputSchema = z.object({
  hint: z.string().describe('A helpful, non-direct hint for the question.'),
});
export type GenerateQuizHintOutput = z.infer<typeof GenerateQuizHintOutputSchema>;

export async function generateQuizHint(input: GenerateQuizHintInput): Promise<GenerateQuizHintOutput> {
  return generateQuizHintFlow(input);
}

const generateQuizHintPrompt = ai.definePrompt({
  name: 'generateQuizHintPrompt',
  input: {schema: GenerateQuizHintInputSchema},
  output: {schema: GenerateQuizHintOutputSchema},
  prompt: `You are an expert quiz assistant.
Given the following quiz question and the summary of the document it's based on, provide a concise and helpful hint.
The hint should guide the user towards the correct answer without giving the answer away directly.

Document Summary:
{{{documentSummary}}}

Quiz Question:
"{{{questionText}}}"

Provide a hint that points the user to the relevant part of the summary or a key concept, or rephrases the question in a simpler way.
`,
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_ONLY_HIGH',
      },
    ],
  },
});

const generateQuizHintFlow = ai.defineFlow(
  {
    name: 'generateQuizHintFlow',
    inputSchema: GenerateQuizHintInputSchema,
    outputSchema: GenerateQuizHintOutputSchema,
  },
  async input => {
    const {output} = await generateQuizHintPrompt(input);
    return output!;
  }
);
