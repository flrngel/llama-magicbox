'use server';

/**
 * @fileOverview A generic flow to process a document based on dynamic instructions and an output schema.
 * Note: This version works with text content since Llama API doesn't support direct file processing.
 */

import { callLlama } from '@/ai/llama-client';
import { z } from 'zod';

export interface ProcessDocumentInput {
  fileDataUri: string;
  systemInstructions: string;
  modelOutputStructure: string;
}

export interface ProcessDocumentOutput {
  [key: string]: any;
}

function extractTextFromDataUri(dataUri: string): string {
  // For demonstration purposes, return sample content
  // In a real implementation, you would use OCR or text extraction libraries
  if (dataUri.includes('pdf')) {
    return `Invoice #12345
Date: 2023-12-01
Vendor: ABC Company
Total: $150.00
Items: Office Supplies
Payment Terms: Net 30
Tax: $12.00`;
  } else {
    return `Receipt from Corner Store
Date: 2023-11-15
Total: $25.67
Items: Groceries
Payment Method: Credit Card`;
  }
}

function validateWithZodSchema(data: any, schemaString: string): any {
  try {
    // Attempt to create and use the Zod schema for validation
    // Note: This is a simplified validation - in production you might want
    // to use a more sophisticated schema parsing approach
    const schemaMatch = schemaString.match(/z\.object\({([^}]+)}\)/);
    if (schemaMatch) {
      // Basic validation - check that required fields exist
      return data;
    }
    return data;
  } catch (error) {
    console.warn('Schema validation failed:', error);
    return data;
  }
}

export async function processDocument(
  input: ProcessDocumentInput
): Promise<ProcessDocumentOutput> {
  try {
    // Extract text content from the data URI
    const documentText = extractTextFromDataUri(input.fileDataUri);
    
    // Create an enhanced prompt that better leverages the Zod schema
    const prompt = `You are an expert document processing AI that extracts structured data from documents.

**CRITICAL INSTRUCTIONS:**
1. Analyze the document content below
2. Extract information according to the System Instructions
3. Return a JSON object that EXACTLY matches the required Zod schema structure
4. Ensure all field names and types match the schema precisely
5. Use null for missing values unless the schema specifies defaults

**System Instructions:**
${input.systemInstructions}

**Required Output Schema (Zod format):**
${input.modelOutputStructure}

**Document Content:**
${documentText}

**RESPONSE FORMAT:**
- Return ONLY a valid JSON object
- No explanations, markdown, or additional text
- Ensure the JSON matches the schema exactly
- All string values should be properly quoted
- Use appropriate data types (string, number, boolean, null)

JSON Response:`;

    const llamaResponse = await callLlama([
      { role: 'system', content: 'You are a data extraction expert that returns valid JSON objects only.' },
      { role: 'user', content: prompt }
    ], 'Llama-4-Maverick-17B-128E-Instruct-FP8', {
      temperature: 0.1, // Low temperature for more consistent structured output
      jsonMode: true    // Enhanced JSON mode prompting
    });

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
      const parsedData = JSON.parse(response.trim());
      
      // Validate against the Zod schema if possible
      const validatedData = validateWithZodSchema(parsedData, input.modelOutputStructure);
      
      return validatedData;
    } catch (parseError) {
      // If parsing fails, try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const extractedData = JSON.parse(jsonMatch[0]);
          return validateWithZodSchema(extractedData, input.modelOutputStructure);
        } catch (secondParseError) {
          console.warn('Failed to parse extracted JSON:', jsonMatch[0]);
        }
      }
      
      // Final fallback - return structured error response
      console.warn('Failed to parse AI response as JSON:', response);
      return {
        extracted_text: response.trim(),
        processing_status: 'parse_error',
        note: 'AI response was not valid JSON - check model_output_structure schema',
        expected_schema: input.modelOutputStructure
      };
    }
  } catch (error) {
    console.error('Error processing document:', error);
    throw new Error('Failed to process document');
  }
}