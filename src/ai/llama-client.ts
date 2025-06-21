import LlamaAPIClient from 'llama-api-client';

export const llamaClient = new LlamaAPIClient({
  apiKey: process.env.LLAMA_API_KEY,
});

export async function callLlama(messages: Array<{role: 'user' | 'system' | 'assistant'; content: string}>, model = 'Llama-4-Maverick-17B-128E-Instruct-FP8') {
  try {
    const response = await llamaClient.chat.completions.create({
      messages,
      model,
    });
    
    return response.completion_message?.content;
  } catch (error) {
    console.error('Llama API error:', error);
    throw new Error('Failed to generate response from Llama API');
  }
}