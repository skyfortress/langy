import { NextApiResponse } from 'next';
import { ChatHistoryService } from '@/services/chatHistoryService';
import { withAuth, AuthenticatedRequest } from '@/utils/auth';

async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse
) {
  const { username } = req.user;
  const chatHistoryService = new ChatHistoryService(username);

  if (req.method === 'GET') {
    try {
      const { sessionId } = req.query;

      if (sessionId && typeof sessionId === 'string') {
        const session = chatHistoryService.getChatSession(sessionId);
        
        if (!session) {
          return res.status(404).json({ message: 'Session not found' });
        }
        
        return res.status(200).json(session);
      } else {
        const sessions = chatHistoryService.getAllChatSessions();
        const latestSession = sessions.length > 0 ? sessions[0] : null;
        
        return res.status(200).json(latestSession || { id: null, messages: [] });
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  } else if (req.method === 'POST') {
    try {
      const newSession = chatHistoryService.createChatSession();
      return res.status(201).json(newSession);
    } catch (error) {
      console.error('Error creating new chat session:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  } else {
    return res.status(405).json({ message: 'Method not allowed' });
  }
}

export default withAuth(handler);