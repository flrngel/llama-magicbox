import { config } from 'dotenv';
config();

import '@/ai/flows/extract-application-data.ts';
import '@/ai/flows/refine-solution-flow.ts';
import '@/ai/flows/categorize-receipts.ts';