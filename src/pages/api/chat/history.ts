import { NextApiResponse } from 'next';
import { ChatHistoryService } from '@/services/chatHistoryService';
import { withAuth, AuthenticatedRequest } from '@/utils/auth';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const { username } = req.user;
  const chatHistoryService = new ChatHistoryService(username);

  if (req.method === 'GET') {
    try {
      const { sessionId } = req.query;

      if (sessionId && typeof sessionId === 'string') {
        const session = await chatHistoryService.getChatSession(sessionId);
        if (!session) {
          return res.status(404).json({ error: 'Chat session not found' });
        }
        return res.status(200).json(session);
      } else {
        const sessions = await chatHistoryService.getAllChatSessions();
        if (sessions.length === 0) {
          return res.status(200).json(null);
        }
        return res.status(200).json(sessions[0]);
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
      return res.status(500).json({ error: 'Failed to fetch chat history' });
    }
  } else if (req.method === 'POST') {
    try {
      const newSession = await chatHistoryService.createChatSession();
      return res.status(201).json(newSession);
    } catch (error) {
      console.error('Error creating chat session:', error);
      return res.status(500).json({ error: 'Failed to create chat session' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { sessionId } = req.query;
      
      if (!sessionId || typeof sessionId !== 'string') {
        return res.status(400).json({ error: 'Session ID is required' });
      }

      const deleted = await chatHistoryService.deleteChatSession(sessionId);
      if (!deleted) {
        return res.status(404).json({ error: 'Chat session not found' });
      }
      
      return res.status(200).json({ message: 'Chat session deleted successfully' });
    } catch (error) {
      console.error('Error deleting chat session:', error);
      return res.status(500).json({ error: 'Failed to delete chat session' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

export default withAuth(handler);