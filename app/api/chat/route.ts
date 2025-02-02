import { createResource } from '@/lib/actions/resources';
import { findRelevantContent } from '@/lib/ai/embedding';
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
    `,
    messages,
    maxSteps: 3,
    tools: {
      addResource: tool({
        description: `add a resource to your knowledge base.
          If the user provides a random piece of knowledge with the "Add" prefix, use this tool without asking for confirmation or answering something.`,
        parameters: z.object({
          content: z
            .string()
            .describe('the content or resource to add to the knowledge base'),
        }),
        execute: async ({ content }) => {
          console.debug('Adding resource with content:', content);
          const result = await createResource({ content });
          console.debug('Resource created:', result);
          return { result };
        },
      }),
      getInformation: tool({
        description: `get information from your knowledge base to answer questions.`,
        parameters: z.object({
          question: z.string().describe('the users question'),
        }),
        execute: async ({ question }) => findRelevantContent(question),
      }),
    },
  });

  return result.toDataStreamResponse();
}
