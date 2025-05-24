
'use server';
/**
 * @fileOverview Generates flashcards from a document summary.
 *
 * - generateFlashcards - A function that generates flashcards.
 * - GenerateFlashcardsInput - The input type for the generateFlashcards function.
 * - GenerateFlashcardsOutput - The return type for the generateFlashcards function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateFlashcardsInputSchema = z.object({
  summaryText: z.string().describe('The summary of the document to generate flashcards from.'),
  maxFlashcards: z.number().min(5).max(20).optional().default(10).describe('The maximum number of flashcards to generate.'),
});
export type GenerateFlashcardsInput = z.infer<typeof GenerateFlashcardsInputSchema>;

const FlashcardSchema = z.object({
  term: z.string().describe('The key term or concept for the front of the flashcard.'),
  definition: z.string().describe('The definition or explanation for the back of the flashcard.'),
});

const GenerateFlashcardsOutputSchema = z.object({
  flashcards: z
    .array(FlashcardSchema)
    .describe('An array of generated flashcards, each with a term and a definition.'),
});
export type GenerateFlashcardsOutput = z.infer<typeof GenerateFlashcardsOutputSchema>;

export async function generateFlashcards(input: GenerateFlashcardsInput): Promise<GenerateFlashcardsOutput> {
  return generateFlashcardsFlow(input);
}

const generateFlashcardsPrompt = ai.definePrompt({
  name: 'generateFlashcardsPrompt',
  input: {schema: GenerateFlashcardsInputSchema},
  output: {schema: GenerateFlashcardsOutputSchema},
  prompt: `You are an expert in creating educational study aids.
Given the following document summary, please extract key terms, concepts, and important facts to create a set of flashcards.
Each flashcard should have a "term" (the front of the card) and a "definition" (the back of the card).
Aim to generate meaningful and concise flashcards that would be helpful for studying the material.
Generate up to {{{maxFlashcards}}} flashcards.

Document Summary:
{{{summaryText}}}

Format your response as a JSON object with a 'flashcards' field. Each item in the 'flashcards' array should be an object with 'term' and 'definition' fields.
Ensure the definitions are explanatory and accurate based on the summary provided.
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

const generateFlashcardsFlow = ai.defineFlow(
  {
    name: 'generateFlashcardsFlow',
    inputSchema: GenerateFlashcardsInputSchema,
    outputSchema: GenerateFlashcardsOutputSchema,
  },
  async (input: GenerateFlashcardsInput) => {
    const {output} = await generateFlashcardsPrompt(input);
    return output!;
  }
);
