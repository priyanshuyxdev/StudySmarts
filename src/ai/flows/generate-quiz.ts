
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
        options: z.array(z.string()).describe('The multiple-choice options (exactly 4).'),
        answer: z.string().describe('The correct answer (must be one of the options).'),
        reason: z.string().describe('A detailed and comprehensive explanation of why the answer is correct, clarifying the concept.'),
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
  Each question should have exactly 4 options, one of which is the correct answer.
  For each question, provide the question text, the 4 options, the correct answer (which must exactly match one of the options), and a detailed and comprehensive reason explaining why that answer is correct and clarifying the underlying concept.

  Summary: {{{summary}}}

  Format your response as a JSON object with a 'questions' field. Each item in the 'questions' array should be an object with 'question', 'options', 'answer', and 'reason' fields.
  The 'options' field should be an array of 4 strings.
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

