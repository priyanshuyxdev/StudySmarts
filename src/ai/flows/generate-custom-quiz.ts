
'use server';
/**
 * @fileOverview Generates a multiple-choice quiz based on a custom user-provided topic.
 *
 * - generateCustomQuiz - A function that generates a quiz.
 * - GenerateCustomQuizInput - The input type for the generateCustomQuiz function.
 * - GenerateCustomQuizOutput - The return type for the generateCustomQuiz function (same as GenerateQuizOutput).
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { GenerateQuizOutput } from './generate-quiz'; // Re-use the output type

const GenerateCustomQuizInputSchema = z.object({
  topic: z.string().describe('The topic or phrase for which the quiz should be generated.'),
  numQuestions: z.number().min(5).max(20).describe('The number of questions to generate (5, 10, 15, or 20).'),
});
export type GenerateCustomQuizInput = z.infer<typeof GenerateCustomQuizInputSchema>;

// Output schema is the same as the standard quiz generation
export type { GenerateQuizOutput as GenerateCustomQuizOutput };

const GenerateCustomQuizOutputSchemaFromOriginal = z.object({ // Re-using the structure from GenerateQuizOutputSchema
    questions: z
      .array(
        z.object({
          question: z.string().describe('The question text.'),
          options: z.array(z.string()).describe('The multiple-choice options (ideally 4, as requested in prompt).'), // Removed .length(4)
          answer: z.string().describe('The correct answer (must be one of the options).'),
          reason: z.string().describe('A detailed and comprehensive explanation of why the answer is correct, clarifying the concept.'),
        })
      )
      .describe('The generated quiz questions.'),
  });

const generateCustomQuizPrompt = ai.definePrompt({
  name: 'generateCustomQuizPrompt',
  input: {schema: GenerateCustomQuizInputSchema},
  output: {schema: GenerateCustomQuizOutputSchemaFromOriginal},
  prompt: `You are an expert in generating educational quizzes.

  Given the following topic and desired number of questions, generate a multiple-choice quiz.
  Topic: "{{{topic}}}"
  Number of Questions: {{{numQuestions}}}

  Each question must:
  1. Be relevant to the provided topic.
  2. Have exactly 4 multiple-choice options.
  3. Have one clearly correct answer among the options.
  4. Include a detailed and comprehensive reason explaining why the answer is correct and clarifying the underlying concept.

  Format your response as a JSON object with a 'questions' field. Each item in the 'questions' array should be an object with 'question', 'options', 'answer', and 'reason' fields.
  The 'options' field should be an array of 4 strings.
  Ensure you generate exactly {{{numQuestions}}} questions.
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

const generateCustomQuizFlow = ai.defineFlow(
  {
    name: 'generateCustomQuizFlow',
    inputSchema: GenerateCustomQuizInputSchema,
    outputSchema: GenerateCustomQuizOutputSchemaFromOriginal,
  },
  async (input: GenerateCustomQuizInput) => {
    const {output} = await generateCustomQuizPrompt(input);
    return output!;
  }
);

export async function generateCustomQuiz(input: GenerateCustomQuizInput): Promise<GenerateCustomQuizOutput> {
  return generateCustomQuizFlow(input);
}
