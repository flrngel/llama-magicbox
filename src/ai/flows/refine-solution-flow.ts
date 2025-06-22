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
    const prompt = `You are an AI training assistant helping a user refine instructions for document processing. 

CONTEXT:
- User wants to process documents and get structured JSON output
- Expected output structure: ${input.modelOutputStructure}
- Current system instructions: "${input.currentInstructions || 'Extract information from documents as structured JSON.'}"

CONVERSATION HISTORY:
${input.trainingContext || 'This is the beginning of our conversation.'}

USER'S LATEST FEEDBACK:
"${input.userInput}"

YOUR TASKS:
1. Create improved system instructions that incorporate the user's feedback
2. Provide a helpful, conversational response (DO NOT include the actual structured output or repeat the data - the user can already see that)

IMPORTANT GUIDELINES FOR YOUR RESPONSE:
- Be conversational and helpful
- Focus on confirming what you learned from their feedback
- Ask follow-up questions if needed
- DO NOT repeat or show the JSON structure/data
- DO NOT include technical details about the output format
- Be concise and natural

EXAMPLE:
User: "Focus more on the vendor name and total amount"
Good response: "Got it! I've updated the instructions to prioritize extracting vendor names and total amounts more accurately. Is there anything specific about how vendor names should be formatted?"

Bad response: "I've updated the instructions. Here's the extracted data: {vendor: 'ABC Corp', amount: 150.00}..." 

CRITICAL: Return ONLY a raw JSON object with this exact structure:
{"updatedSystemInstructions": "your improved instructions here", "aiResponse": "your conversational response here"}

Do NOT include any markdown, explanations, or text outside the JSON object.`;

    const response = await callLlama([
      { role: 'system', content: 'You are an expert at creating system prompts for AI assistants. Always return valid JSON.' },
      { role: 'user', content: prompt }
    ]);

    try {
      if (response) {
        const responseStr = typeof response === 'string' ? response : String(response);
        
        // Try to extract JSON from markdown or text response
        let jsonStr = responseStr.trim();
        
        // Remove markdown code blocks if present
        if (jsonStr.includes('```json')) {
          const jsonMatch = jsonStr.match(/```json\s*(\{[\s\S]*?\})\s*```/);
          if (jsonMatch) {
            jsonStr = jsonMatch[1];
          }
        } else if (jsonStr.includes('```')) {
          const jsonMatch = jsonStr.match(/```\s*(\{[\s\S]*?\})\s*```/);
          if (jsonMatch) {
            jsonStr = jsonMatch[1];
          }
        }
        
        // Try to find the last JSON object in the response
        const jsonMatches = jsonStr.match(/\{[^{}]*"updatedSystemInstructions"[^{}]*"aiResponse"[^{}]*\}/g);
        if (jsonMatches) {
          jsonStr = jsonMatches[jsonMatches.length - 1];
        }
        
        const parsed = JSON.parse(jsonStr);
        return {
          updatedSystemInstructions: parsed.updatedSystemInstructions || input.currentInstructions || '',
          aiResponse: parsed.aiResponse || 'I\'ve updated the instructions based on your feedback.'
        };
      } else {
        throw new Error('No response received');
      }
    } catch (parseError) {
      console.error('Failed to parse refinement response:', parseError);
      console.error('Raw response:', response);
      
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