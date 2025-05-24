
import { config } from 'dotenv';
config();

import '@/ai/flows/summarize-document.ts';
import '@/ai/flows/generate-quiz.ts';
import '@/ai/flows/generate-quiz-hint.ts'; // Added new hint flow
import '@/ai/flows/generate-custom-quiz.ts'; // Added new custom quiz flow
import '@/ai/flows/generate-flashcards.ts'; // Added new flashcard flow

