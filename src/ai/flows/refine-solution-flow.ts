'use server';
/**
 * @fileOverview Allows the creator to refine a solution by interacting with the AI through a chat interface.
 *
 * - refineSolution - A function that handles the solution refinement process.
 * - RefineSolutionInput - The input type for the refineSolution function.
 * - RefineSolutionOutput - The return type for the refineSolution function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RefineSolutionInputSchema = z.object({
  solutionId: z.string().describe('The ID of the solution to refine.'),
  userInput: z.string().describe('The user input to further train/refine the solution.'),
  trainingContext: z.string().optional().describe('The previous training context (conversation history).'),
});
export type RefineSolutionInput = z.infer<typeof RefineSolutionInputSchema>;

const RefineSolutionOutputSchema = z.object({
  updatedSolution: z.string().describe('The updated solution.'),
  newTrainingContext: z.string().describe('The updated training context, including the latest user input and AI response.'),
});
export type RefineSolutionOutput = z.infer<typeof RefineSolutionOutputSchema>;

export async function refineSolution(input: RefineSolutionInput): Promise<RefineSolutionOutput> {
  return refineSolutionFlow(input);
}

const refineSolutionPrompt = ai.definePrompt({
  name: 'refineSolutionPrompt',
  input: {schema: RefineSolutionInputSchema},
  output: {schema: RefineSolutionOutputSchema},
  prompt: `You are an AI assistant helping a user refine their AI solution. The user has provided the following input to further train/refine the solution: {{{userInput}}}.

  Previous Training Context: {{{trainingContext}}}

  Update the solution and provide a new training context incorporating the user's latest input.
  Ensure that newTrainingContext contains both user's input and AI's response.

  Updated Solution:`, // Placeholder - will need more detailed instructions
});

const refineSolutionFlow = ai.defineFlow(
  {
    name: 'refineSolutionFlow',
    inputSchema: RefineSolutionInputSchema,
    outputSchema: RefineSolutionOutputSchema,
  },
  async input => {
    const {output} = await refineSolutionPrompt(input);
    return output!;
  }
);
