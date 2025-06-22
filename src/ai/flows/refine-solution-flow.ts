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
  shouldUserFollow: boolean; // true if AI is asking a follow-up question and needs more info
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
1. Analyze if the user's feedback is clear enough to update instructions, or if you need more information
2. If clear enough: Create improved system instructions and provide confirmation
3. If unclear: Ask a specific follow-up question to clarify what they want

DECISION LOGIC:
- If user feedback is vague, ambiguous, or missing key details → set shouldUserFollow: true and ask specific questions
- If user feedback is clear and actionable → set shouldUserFollow: false and update instructions

EXAMPLES OF WHEN TO ASK FOLLOW-UP (shouldUserFollow: true):
- User: "Make it better" → Ask: "What specific aspect should I improve?"
- User: "Fix the names" → Ask: "How should the names be formatted or what's wrong with them?"
- User: "Add more fields" → Ask: "Which additional fields would you like me to extract?"

EXAMPLES OF WHEN TO UPDATE (shouldUserFollow: false):
- User: "Normalize abbreviations like LRG to LARGE" → Clear, actionable instruction
- User: "Extract the date in MM/DD/YYYY format" → Specific formatting requirement
- User: "Focus only on line items, ignore headers" → Clear extraction guidance

IMPORTANT GUIDELINES FOR YOUR RESPONSE:
- Be conversational and helpful
- DO NOT repeat or show the JSON structure/data
- DO NOT include technical details about the output format
- Be concise and natural
- When asking follow-up questions, be specific about what information you need

CRITICAL: Return ONLY a raw JSON object with this exact structure:
{"updatedSystemInstructions": "your improved instructions here", "aiResponse": "your conversational response here", "shouldUserFollow": true/false}

- If shouldUserFollow is true: Keep updatedSystemInstructions the same as current instructions
- If shouldUserFollow is false: Provide improved instructions based on user feedback

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
        const jsonMatches = jsonStr.match(/\{[^{}]*"updatedSystemInstructions"[^{}]*"aiResponse"[^{}]*"shouldUserFollow"[^{}]*\}/g);
        if (jsonMatches) {
          jsonStr = jsonMatches[jsonMatches.length - 1];
        }
        
        const parsed = JSON.parse(jsonStr);
        return {
          updatedSystemInstructions: parsed.updatedSystemInstructions || input.currentInstructions || '',
          aiResponse: parsed.aiResponse || 'I\'ve updated the instructions based on your feedback.',
          shouldUserFollow: parsed.shouldUserFollow || false
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
        aiResponse: 'I understand your feedback and will incorporate it into the instructions.',
        shouldUserFollow: false
      };
    }
  } catch (error) {
    console.error('Error refining solution:', error);
    throw new Error('Failed to refine solution');
  }
}