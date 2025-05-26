import type { NextApiRequest, NextApiResponse } from 'next';
import { generateChatCompletion } from '../../../services/aiService';
import { addCard } from '../../../services/cardService';
import { ChatCompletionRequest, ToolCall } from '../../../types/chat';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { message, chatHistory } = req.body as ChatCompletionRequest;

    if (!message) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const userMessage = {
      id: uuidv4(),
      role: 'user' as const,
      content: message,
      timestamp: new Date()
    };

    const response = await generateChatCompletion({
      message,
      chatHistory: chatHistory ? [...chatHistory, userMessage] : [userMessage]
    });

    const processedToolCalls = await processToolCalls(response.message.toolCalls);

    return res.status(200).json({
      userMessage,
      assistantMessage: response.message,
      processedToolCalls
    });
  } catch (error) {
    console.error('Error in chat completion endpoint:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function processToolCalls(toolCalls?: ToolCall[]) {
  if (!toolCalls || toolCalls.length === 0) {
    return [];
  }

  const results = [];

  for (const call of toolCalls) {
    if (call.name === 'createCard') {
      const { word, translation } = call.args;
      
      try {
        const newCard = addCard({
          front: word,
          back: translation
        });
        
        results.push({
          id: call.id,
          type: call.type,
          name: call.name,
          status: 'success',
          result: newCard
        });
      } catch (error) {
        console.error('Error creating card:', error);
        results.push({
          id: call.id,
          type: call.type,
          name: call.name,
          status: 'error',
          error: 'Failed to create card'
        });
      }
    }
  }
  
  return results;
}