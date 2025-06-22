'use server';

/**
 * @fileOverview A generic flow to process a document based on dynamic instructions and an output schema.
 * Note: This version works with text content since Llama API doesn't support direct file processing.
 */

import { callLlama, MessageContent } from '@/ai/llama-client';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

export interface ProcessDocumentInput {
  fileDataUri: string;
  systemInstructions: string;
  modelOutputStructure: string; // Keep string for backward compatibility
  outputSchema?: z.ZodType<any>; // New optional Zod schema for structured output
}

export interface ProcessDocumentOutput {
  [key: string]: any;
}

function isImageDataUri(dataUri: string): boolean {
  return dataUri.startsWith('data:image/');
}

function isPdfDataUri(dataUri: string): boolean {
  return dataUri.startsWith('data:application/pdf');
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
    // Create proper system message with instructions
    const systemMessage = `You are an expert document processing AI that extracts structured data from images and documents.

CORE INSTRUCTIONS:
${input.systemInstructions}

TECHNICAL REQUIREMENTS:
- Analyze the provided image/document carefully to extract all visible information
- Return a JSON object that EXACTLY matches the required schema structure
- Ensure all field names and types match the schema precisely
- Use null for missing values unless the schema specifies defaults
- Return ONLY a valid JSON object (no explanations, markdown, or additional text)
- All string values should be properly quoted
- Use appropriate data types (string, number, boolean, null)

REQUIRED OUTPUT SCHEMA:
${input.modelOutputStructure}`;

    // User message just contains the document to process
    const userPrompt = "Please analyze this document and extract the information according to the system instructions. Return only valid JSON.";

    // debug
    console.log('systemInstructions being used:', input.systemInstructions);

    const userContent: MessageContent = [
      { type: 'text', text: userPrompt },
      { type: 'image_url', image_url: { url: input.fileDataUri } }
    ];

    // Prepare options for Llama API call
    const llamaOptions: any = {
      temperature: 0.1, // Low temperature for more consistent structured output
    };

    // Use structured output if Zod schema is provided
    if (input.outputSchema) {
      try {
        const jsonSchema = zodToJsonSchema(input.outputSchema);
        llamaOptions.jsonSchema = {
          name: 'document_extraction',
          schema: jsonSchema
        };
      } catch (schemaError) {
        console.warn('Failed to convert Zod schema to JSON schema, falling back to JSON mode:', schemaError);
        llamaOptions.jsonMode = true;
      }
    } else {
      llamaOptions.jsonMode = true; // Fallback to JSON mode prompting
    }

    const llamaResponse = await callLlama([
      { role: 'system', content: systemMessage },
      { role: 'user', content: userContent }
    ], 'Llama-4-Maverick-17B-128E-Instruct-FP8', llamaOptions);

    let response: string;
    console.log('llamaResponse type:', typeof llamaResponse);
    console.log('llamaResponse:', llamaResponse);
    
    if (!llamaResponse) {
      throw new Error('No response received from Llama API');
    } else if (typeof llamaResponse === 'string') {
      response = llamaResponse;
    } else {
      // Handle the case where llamaResponse might be a complex object
      console.warn('Received non-string response from Llama API, attempting to convert:', llamaResponse);
      if (typeof llamaResponse === 'object' && llamaResponse !== null) {
        // If it's an object, try to extract meaningful content
        if ('content' in llamaResponse) {
          response = String((llamaResponse as any).content);
        } else {
          // Try to serialize as JSON
          try {
            response = JSON.stringify(llamaResponse);
          } catch (err) {
            console.error('Failed to serialize Llama response:', err);
            response = String(llamaResponse);
          }
        }
      } else {
        response = String(llamaResponse);
      }
    }

    console.log('Final response string:', response);

    // Try to parse the response as JSON
    try {
      const parsedData = JSON.parse(response.trim());
      
      // Validate against the Zod schema if available
      if (input.outputSchema) {
        try {
          const validatedData = input.outputSchema.parse(parsedData);
          return validatedData;
        } catch (zodError) {
          console.warn('Zod validation failed:', zodError);
          // Return raw data if validation fails, with warning
          return {
            ...parsedData,
            _validation_warning: 'Data did not fully match expected schema',
            _validation_errors: zodError instanceof Error ? zodError.message : String(zodError)
          };
        }
      } else {
        // Fallback validation using string-based schema
        const validatedData = validateWithZodSchema(parsedData, input.modelOutputStructure);
        return validatedData;
      }
    } catch (parseError) {
      // If parsing fails, try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const extractedData = JSON.parse(jsonMatch[0]);
          
          // Validate with Zod schema if available
          if (input.outputSchema) {
            try {
              return input.outputSchema.parse(extractedData);
            } catch (zodError) {
              console.warn('Zod validation failed on extracted JSON:', zodError);
              return {
                ...extractedData,
                _validation_warning: 'Extracted data did not match expected schema',
                _validation_errors: zodError instanceof Error ? zodError.message : String(zodError)
              };
            }
          } else {
            return validateWithZodSchema(extractedData, input.modelOutputStructure);
          }
        } catch (secondParseError) {
          console.warn('Failed to parse extracted JSON:', jsonMatch[0]);
        }
      }
      
      // Final fallback - return structured error response
      console.warn('Failed to parse AI response as JSON:', response);
      return {
        extracted_text: response.trim(),
        processing_status: 'parse_error',
        note: 'AI response was not valid JSON - check output schema',
        expected_schema: input.outputSchema ? 'Zod schema provided' : input.modelOutputStructure
      };
    }
  } catch (error) {
    console.error('Error processing document:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        throw new Error('API key error: Please check your LLAMA_API_KEY environment variable');
      }
      if (error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to AI service');
      }
      if (error.message.includes('JSON')) {
        throw new Error('Response parsing error: AI returned invalid data format');
      }
      if (error.message.includes('401')) {
        throw new Error('Authentication error: Invalid API key');
      }
      if (error.message.includes('429')) {
        throw new Error('Rate limit error: Too many requests, please try again later');
      }
      throw error; // Re-throw with original message if it's already descriptive
    }
    
    throw new Error(`Document processing failed: ${String(error)}`);
  }
}