'use server';

/**
 * @fileOverview This flow categorizes receipts into expense categories and extracts key information.
 *
 * - categorizeReceipts - A function that handles the receipt categorization process.
 * - CategorizeReceiptsInput - The input type for the categorizeReceipts function.
 * - CategorizeReceiptsOutput - The return type for the categorizeReceipts function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CategorizeReceiptsInputSchema = z.object({
  receiptDataUri: z
    .string()
    .describe(
      "A receipt image, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  instructions: z
    .string()
    .describe(
      'Instructions on what expense categories to use, and other information to extract.'
    ),
});
export type CategorizeReceiptsInput = z.infer<typeof CategorizeReceiptsInputSchema>;

const CategorizeReceiptsOutputSchema = z.object({
  expenseCategory: z.string().describe('The expense category of the receipt.'),
  date: z.string().describe('The date of the receipt.'),
  vendor: z.string().describe('The vendor of the receipt.'),
  amount: z.number().describe('The amount of the receipt.'),
});
export type CategorizeReceiptsOutput = z.infer<typeof CategorizeReceiptsOutputSchema>;

export async function categorizeReceipts(
  input: CategorizeReceiptsInput
): Promise<CategorizeReceiptsOutput> {
  return categorizeReceiptsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'categorizeReceiptsPrompt',
  input: {schema: CategorizeReceiptsInputSchema},
  output: {schema: CategorizeReceiptsOutputSchema},
  prompt: `You are an expert accountant specializing in categorizing receipts.

You will use this information to categorize the receipt, and extract key information from it such as the date, vendor, and amount.

Instructions: {{{instructions}}}

Receipt Image: {{media url=receiptDataUri}}`,
});

const categorizeReceiptsFlow = ai.defineFlow(
  {
    name: 'categorizeReceiptsFlow',
    inputSchema: CategorizeReceiptsInputSchema,
    outputSchema: CategorizeReceiptsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
