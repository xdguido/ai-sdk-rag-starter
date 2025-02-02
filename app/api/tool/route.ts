import { streamText, tool } from 'ai';
import { createOllama } from 'ollama-ai-provider';
import { z } from 'zod';

const ollama = createOllama({
  // optional settings, e.g.
  baseURL: 'http://localhost:11434/api',
});

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();
  console.debug('Chat messages:', messages);

  const result = streamText({
    model: ollama('llama3.1', {
      simulateStreaming: true,
    }),
    system: `You are a helpful assistant.
    ONLY use the 'weather' tool when the user specifically asks for weather in a location. If the user ask the weather but doesn't mention a location, kindly ask them to provide the city or region but never call the tool."`,
    messages,
    tools: {
      weather: tool({
        description: 'Get the weather in a location if you need it',
        parameters: z.object({
          location: z.string().describe('The location to get the weather for'),
        }),
        execute: async ({ location }) => ({
          location,
          temperature: 72 + Math.floor(Math.random() * 21) - 10,
        }),
      }),
    },
    maxSteps: 5,
  });

  console.debug('Streaming response');
  return result.toDataStreamResponse();
}
