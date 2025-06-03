import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@/utils/auth';
import { ChatCompletionRequest, ChatMessage, ProcessedToolCall } from '@/types/chat';
import { ChatHistoryService } from '../../../services/chatHistoryService';
import { generateChatCompletion } from '../../../services/aiService';
import { CardService } from '../../../services/cardService';

async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { username } = req.user;
    const cardService = new CardService(username);
    const chatHistoryService = new ChatHistoryService(username);
    
    const { message, chatHistory, sessionId }: ChatCompletionRequest & { sessionId?: string } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    let session = sessionId ? await chatHistoryService.getChatSession(sessionId) : null;
    if (!session) {
      session = await chatHistoryService.createChatSession();
    }

    const currentHistory = chatHistory || session.messages;
    const cards = await cardService.getAllCards();

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date()
    };

    const { message: assistantMessage } = await generateChatCompletion(
      { message, chatHistory: currentHistory },
      cards
    );

    const processedToolCalls: ProcessedToolCall[] = [];
    
    if (assistantMessage.toolCalls) {
      for (const toolCall of assistantMessage.toolCalls) {
        try {
          if (toolCall.name === 'createCard') {
            const { word, translation, context } = toolCall.args;
            await cardService.addCard({
              front: word,
              back: translation
            });
            
            processedToolCalls.push({
              id: toolCall.id,
              type: toolCall.type,
              name: toolCall.name,
              status: 'success',
              result: { word, translation, context }
            });
          }
        } catch (error) {
          processedToolCalls.push({
            id: toolCall.id,
            type: toolCall.type,
            name: toolCall.name,
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    }

    const updatedMessages = [...currentHistory, userMessage, assistantMessage];
    await chatHistoryService.updateChatSession(session.id, updatedMessages);

    res.status(200).json({
      userMessage,
      assistantMessage,
      processedToolCalls,
      sessionId: session.id
    });
  } catch (error) {
    console.error('Error generating chat response:', error);
    res.status(500).json({ message: 'Failed to generate response' });
  }
}

export default withAuth(handler);