'use server';

/**
 * @fileOverview A flow that generates a Zod schema string from a natural language description.
 */

import { callLlama } from '@/ai/llama-client';

export interface GenerateOutputSchemaInput {
  description: string;
}

export interface GenerateOutputSchemaOutput {
  schema: string;
}

export async function generateOutputSchema(
  input: GenerateOutputSchemaInput
): Promise<GenerateOutputSchemaOutput> {
  try {
    const prompt = `You are an expert programmer specializing in TypeScript and Zod. Your task is to convert a user's natural language description of data fields into a Zod schema string.

**Instructions:**
1. Read the user's description: "${input.description}".
2. Identify each field the user wants.
3. Convert field names to 'snake_case'.
4. Infer the most appropriate Zod type for each field (e.g., z.string(), z.number(), z.boolean()). Use z.string() for dates unless specified otherwise.
5. Combine all fields into a single 'z.object({})'.
6. Add a .describe() to each field with the original user text for that field to help the processing AI.
7. Return **ONLY** the Zod schema as a single, raw string. Do not include any other text, explanations, or markdown formatting.

**Example 1:**
User Description: "I need the customer's full name, their age as a number, and whether they are a premium member."
Your Output: "z.object({ customer_full_name: z.string().describe('the customer\\'s full name'), age: z.number().describe('their age'), is_premium_member: z.boolean().describe('whether they are a premium member') })"

**Example 2:**
User Description: "vendor name, transaction date, and total amount"
Your Output: "z.object({ vendor_name: z.string().describe('vendor name'), transaction_date: z.string().describe('transaction date'), total_amount: z.number().describe('total amount') })"

Now, generate the schema string for the following user description.`;

    const response = await callLlama([
      { role: 'system', content: 'You are a TypeScript and Zod expert that generates clean, properly formatted Zod schemas.' },
      { role: 'user', content: prompt }
    ]);

    if (!response) {
      throw new Error('No response received from Llama API');
    }

    if (typeof response === 'string') {
      return { schema: response };
    } else {
      return { schema: String(response) };
    }
    
  } catch (error) {
    console.error('Error generating output schema:', error);
    throw new Error('Failed to generate output schema');
  }
}