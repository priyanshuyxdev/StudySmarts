
// src/ai/flows/generate-quiz.ts
'use server';

/**
 * @fileOverview Generates a multiple-choice quiz from a document summary.
 *
 * - generateQuiz - A function that generates a quiz from a document summary.
 * - GenerateQuizInput - The input type for the generateQuiz function.
 * - GenerateQuizOutput - The return type for the generateQuiz function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateQuizInputSchema = z.object({
  summary: z.string().describe('The summary of the document.'),
});
export type GenerateQuizInput = z.infer<typeof GenerateQuizInputSchema>;

const GenerateQuizOutputSchema = z.object({
  questions: z
    .array(
      z.object({
        question: z.string().describe('The question text.'),
        options: z.array(z.string()).describe('The multiple-choice options.'),
        answer: z.string().describe('The correct answer.'),
      })
    )
    .describe('The generated quiz questions.'),
});
export type GenerateQuizOutput = z.infer<typeof GenerateQuizOutputSchema>;

export async function generateQuiz(input: GenerateQuizInput): Promise<GenerateQuizOutput> {
  return generateQuizFlow(input);
}

const generateQuizPrompt = ai.definePrompt({
  name: 'generateQuizPrompt',
  input: {schema: GenerateQuizInputSchema},
  output: {schema: GenerateQuizOutputSchema},
  prompt: `You are an expert in generating quizzes from text.

  Given the following summary of a document, generate a quiz with at least 10 multiple-choice questions, and up to 15 if the content is rich enough, to test the user's understanding of the material.
  Each question should have 4 options, one of which is the correct answer.

  Summary: {{{summary}}}

  Format your response as a JSON object with a 'questions' field. Each question should have a 'question', 'options', and 'answer' field.
  The 'options' field should be an array of 4 strings, and the 'answer' field should be the correct answer from the options.
  `,config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_ONLY_HIGH',
      },
    ],
  },
});

const generateQuizFlow = ai.defineFlow(
  {
    name: 'generateQuizFlow',
    inputSchema: GenerateQuizInputSchema,
    outputSchema: GenerateQuizOutputSchema,
  },
  async input => {
    const {output} = await generateQuizPrompt(input);
    return output!;
  }
);
