import LlamaAPIClient from 'llama-api-client';

export const llamaClient = new LlamaAPIClient({
  apiKey: process.env.LLAMA_API_KEY,
});

export async function callLlama(
  messages: Array<{role: 'user' | 'system' | 'assistant'; content: string}>, 
  model = 'Llama-4-Maverick-17B-128E-Instruct-FP8',
  options?: { 
    temperature?: number; 
    max_tokens?: number;
    jsonMode?: boolean;
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
    
    // If JSON mode is requested, enhance the system message
    if (options?.jsonMode && messages.length > 0 && messages[0].role === 'system') {
      messages[0].content += '\n\nIMPORTANT: You must respond with valid JSON only. Do not include any text outside the JSON structure.';
    }

    const response = await llamaClient.chat.completions.create(requestParams);
    
    return response.completion_message?.content;
  } catch (error) {
    console.error('Llama API error:', error);
    throw new Error('Failed to generate response from Llama API');
  }
}