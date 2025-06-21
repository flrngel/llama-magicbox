'use server';

/**
 * @fileOverview A flow that extracts key data from rental applications.
 *
 * - extractApplicationData - A function that handles the data extraction process.
 * - ExtractApplicationDataInput - The input type for the extractApplicationData function.
 * - ExtractApplicationDataOutput - The return type for the extractApplicationData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractApplicationDataInputSchema = z.object({
  applicationDataUri: z
    .string()
    .describe(
      "A rental application document, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractApplicationDataInput = z.infer<typeof ExtractApplicationDataInputSchema>;

const ExtractApplicationDataOutputSchema = z.object({
  applicantName: z.string().describe('The full name of the applicant.'),
  contactInformation: z
    .object({
      phone: z.string().describe('The phone number of the applicant.'),
      email: z.string().describe('The email address of the applicant.'),
    })
    .describe('The contact information of the applicant.'),
  employmentHistory: z
    .array(
      z.object({
        employer: z.string().describe('The name of the employer.'),
        position: z.string().describe('The position held by the applicant.'),
        startDate: z.string().describe('The start date of employment.'),
        endDate: z.string().describe('The end date of employment.'),
      })
    )
    .describe('The employment history of the applicant.'),
  references: z
    .array(
      z.object({
        name: z.string().describe('The name of the reference.'),
        relationship: z.string().describe('The relationship to the applicant.'),
        contact: z.string().describe('The contact information of the reference.'),
      })
    )
    .describe('The references provided by the applicant.'),
});
export type ExtractApplicationDataOutput = z.infer<typeof ExtractApplicationDataOutputSchema>;

export async function extractApplicationData(
  input: ExtractApplicationDataInput
): Promise<ExtractApplicationDataOutput> {
  return extractApplicationDataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractApplicationDataPrompt',
  input: {schema: ExtractApplicationDataInputSchema},
  output: {schema: ExtractApplicationDataOutputSchema},
  prompt: `You are an expert at extracting data from rental applications.

You will receive a rental application as input, and you will extract the following information:
- Applicant Name
- Contact Information (phone and email)
- Employment History (employer, position, start date, end date)
- References (name, relationship, contact information)

Make sure that your output is valid JSON conforming to the schema.

Use the following as the primary source of information about the applicant.

Application: {{media url=applicationDataUri}}`,
});

const extractApplicationDataFlow = ai.defineFlow(
  {
    name: 'extractApplicationDataFlow',
    inputSchema: ExtractApplicationDataInputSchema,
    outputSchema: ExtractApplicationDataOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
