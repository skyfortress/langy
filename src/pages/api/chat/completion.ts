import type { NextApiRequest, NextApiResponse } from 'next';
import { generateChatCompletion } from '../../../services/aiService';
import { ChatCompletionRequest, ChatCompletionResponse } from '../../../types/chat';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { message, language, chatHistory } = req.body as ChatCompletionRequest;

    if (!message || !language) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Process the user message
    const userMessage = {
      id: uuidv4(),
      role: 'user' as const,
      content: message,
      timestamp: new Date()
    };

    // Generate AI response
    const response = await generateChatCompletion({
      message,
      language,
      chatHistory: chatHistory ? [...chatHistory, userMessage] : [userMessage]
    });

    return res.status(200).json({
      userMessage,
      assistantMessage: response.message
    });
  } catch (error) {
    console.error('Error in chat completion endpoint:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}