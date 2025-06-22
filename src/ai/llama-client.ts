import LlamaAPIClient from 'llama-api-client';

export const llamaClient = new LlamaAPIClient({
  apiKey: process.env.LLAMA_API_KEY,
});

// Support multimodal content types
export type MessageContent = 
  | string 
  | Array<{
      type: 'text';
      text: string;
    } | {
      type: 'image_url';
      image_url: {
        url: string;
      };
    }>;

export async function callLlama(
  messages: Array<{role: 'user' | 'system' | 'assistant'; content: MessageContent}>, 
  model = 'Llama-4-Maverick-17B-128E-Instruct-FP8',
  options?: { 
    temperature?: number; 
    max_tokens?: number;
    jsonMode?: boolean;
    jsonSchema?: { name: string; schema: object };
  }
) {
  try {
    const requestParams: any = {
      messages,
      model,
    };

    // Add optional parameters if provided
    if (options?.temperature !== undefined) {
      requestParams.temperature = options.temperature;
    }
    if (options?.max_tokens !== undefined) {
      requestParams.max_tokens = options.max_tokens;
    }
    
    // Use proper structured output if JSON schema is provided
    if (options?.jsonSchema) {
      requestParams.response_format = {
        type: 'json_schema',
        json_schema: {
          name: options.jsonSchema.name,
          schema: options.jsonSchema.schema
        }
      };
    }
    // Fallback to JSON mode prompting if no schema provided but JSON requested
    else if (options?.jsonMode && messages.length > 0 && messages[0].role === 'system') {
      // Handle both string and array content
      if (typeof messages[0].content === 'string') {
        messages[0].content += '\n\nIMPORTANT: You must respond with valid JSON only. Do not include any text outside the JSON structure.';
      } else if (Array.isArray(messages[0].content)) {
        // Find the first text content and append to it
        const textContent = messages[0].content.find(item => item.type === 'text');
        if (textContent) {
          textContent.text += '\n\nIMPORTANT: You must respond with valid JSON only. Do not include any text outside the JSON structure.';
        }
      }
    }

    // debug
    console.dir(requestParams, { depth: null });

    const response = await llamaClient.chat.completions.create(requestParams);
    
    // Ensure we return a string
    const content = response.completion_message?.content;
    console.log('Raw content type:', typeof content);
    console.log('Raw content:', content);
    
    if (typeof content === 'string') {
      return content;
    } else if (content && typeof content === 'object') {
      // If content is an object, try to extract text or serialize properly
      if ('text' in content) {
        return (content as any).text as string;
      } else if (Array.isArray(content)) {
        // Handle array of content parts
        return (content as any[]).map((part: any) => {
          if (typeof part === 'string') return part;
          if (part && typeof part === 'object' && 'text' in part) return part.text;
          return JSON.stringify(part);
        }).join('');
      } else {
        // Last resort: try to serialize the object as JSON
        try {
          return JSON.stringify(content);
        } catch (err) {
          console.warn('Failed to serialize content object:', err);
          return String(content);
        }
      }
    } else {
      return undefined;
    }
  } catch (error) {
    console.error('Llama API error:', error);
    throw new Error('Failed to generate response from Llama API');
  }
}