'use server';

/**
 * @fileOverview A generic flow to process a document based on dynamic instructions and an output schema.
 * Note: This version works with text content since Llama API doesn't support direct file processing.
 */

import { callLlama } from '@/ai/llama-client';

export interface ProcessDocumentInput {
  fileDataUri: string;
  systemInstructions: string;
  modelOutputStructure: string;
}

export interface ProcessDocumentOutput {
  [key: string]: any;
}

export async function processDocument(
  input: ProcessDocumentInput
): Promise<ProcessDocumentOutput> {
  try {
    // For now, we'll create a mock response since Llama API doesn't support direct file processing
    // In a real implementation, you'd need to extract text from the file first
    const prompt = `You are an AI assistant designed to extract structured data from documents.

**Your Task:**
1. Carefully read the provided System Instructions to understand your goal.
2. Analyze the document content provided.
3. Generate a JSON object containing the extracted data.
4. The JSON object you generate **MUST** strictly conform to the structure defined in the provided Zod Schema.

---
**System Instructions:**
${input.systemInstructions}
---
**Required JSON Output Schema (as a Zod string):**
\`\`\`
${input.modelOutputStructure}
\`\`\`
---
**Document Content:**
[Note: This is a simplified implementation. In a real scenario, you would extract text from the file at: ${input.fileDataUri}]

For demonstration purposes, here's sample document content:
Invoice #12345
Date: 2023-12-01
Vendor: ABC Company
Total: $150.00
Items: Office Supplies
---

Respond ONLY with the valid JSON object. Do not include any other text, explanations, or markdown formatting.`;

    const llamaResponse = await callLlama([
      { role: 'system', content: 'You are a data extraction expert that returns valid JSON objects only.' },
      { role: 'user', content: prompt }
    ]);

    let response;
    if (!llamaResponse) {
      throw new Error('No response received from Llama API');
    } else if (typeof llamaResponse !== 'string') {
      response = llamaResponse.text;
    } else {
      response = llamaResponse;
    }

    // Try to parse the response as JSON
    try {
      return JSON.parse(response.trim());
    } catch (parseError) {
      // If parsing fails, return a fallback object
      console.warn('Failed to parse AI response as JSON:', response);
      return {
        extracted_text: response.trim(),
        processing_status: 'partial_success',
        note: 'AI response was not valid JSON'
      };
    }
  } catch (error) {
    console.error('Error processing document:', error);
    throw new Error('Failed to process document');
  }
}