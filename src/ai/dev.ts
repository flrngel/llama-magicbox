import { config } from 'dotenv';
config();

// The generic flows are now used instead of these specific ones.
// Keeping them for reference but they are no longer actively used in the app.
// import '@/ai/flows/extract-application-data.ts';
// import '@/ai/flows/categorize-receipts.ts';

import '@/ai/flows/refine-solution-flow.ts';
import '@/ai/flows/generate-output-schema.ts';
import '@/ai/flows/process-document-flow.ts';