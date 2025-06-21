'use server';

/**
 * @fileOverview A flow to refine and improve solution instructions based on user feedback.
 */

import { callLlama } from '@/ai/llama-client';

export interface RefineSolutionInput {
  currentInstructions?: string;
  userInput: string;
  trainingContext?: string;
  modelOutputStructure: string;
}

export interface RefineSolutionOutput {
  updatedSystemInstructions: string;
  aiResponse: string;
}

export async function refineSolution(
  input: RefineSolutionInput
): Promise<RefineSolutionOutput> {
  try {
    const prompt = `You are an AI assistant that helps a user build a "System Instruction" prompt for another AI.
The user wants to process documents and get a JSON output with this structure: ${input.modelOutputStructure}.

The user's conversation with you so far (the training context):
${input.trainingContext || 'This is the beginning of our conversation.'}

The current System Instruction is:
"${input.currentInstructions || 'You are a helpful AI assistant. Extract information from the provided document based on the user\'s requirements and return it as a structured JSON object.'}"

The user has just said:
"${input.userInput}"

Your tasks:
1. Synthesize a new, improved "System Instruction". It should incorporate the user's latest feedback. The instruction must be a complete, self-contained prompt for another AI. It should tell the AI to extract information from a document and format it as JSON according to the user's desired structure.
2. Provide a short, conversational response to the user confirming you've understood their request.

Example:
If the user says "focus on the total amount and vendor name", your response could be "Got it. I will update the instructions to focus on extracting the total amount and vendor name. Is there anything else?"
Your new System Instruction would then be a comprehensive prompt that includes this new focus.

Generate the response as JSON with two fields: "updatedSystemInstructions" and "aiResponse".`;

    const response = await callLlama([
      { role: 'system', content: 'You are an expert at creating system prompts for AI assistants. Always return valid JSON.' },
      { role: 'user', content: prompt }
    ]);

    try {
      const parsed = JSON.parse(response.trim());
      return {
        updatedSystemInstructions: parsed.updatedSystemInstructions || input.currentInstructions || '',
        aiResponse: parsed.aiResponse || 'I\'ve updated the instructions based on your feedback.'
      };
    } catch (parseError) {
      // Fallback if JSON parsing fails
      return {
        updatedSystemInstructions: input.currentInstructions || 'You are a helpful AI assistant. Extract information from the provided document based on the user\'s requirements and return it as a structured JSON object.',
        aiResponse: 'I understand your feedback and will incorporate it into the instructions.'
      };
    }
  } catch (error) {
    console.error('Error refining solution:', error);
    throw new Error('Failed to refine solution');
  }
}