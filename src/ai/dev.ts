
import { config } from 'dotenv';
config();

import '@/ai/flows/summarize-document.ts';
import '@/ai/flows/generate-quiz.ts';
import '@/ai/flows/generate-quiz-hint.ts'; // Added new hint flow
