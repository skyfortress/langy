import type { NextApiRequest, NextApiResponse } from 'next';
import { getChatSession, getAllChatSessions } from '../../../services/chatHistoryService';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { sessionId } = req.query;

    if (sessionId && typeof sessionId === 'string') {
      const session = getChatSession(sessionId);
      
      if (!session) {
        return res.status(404).json({ message: 'Session not found' });
      }
      
      return res.status(200).json(session);
    } else {
      const sessions = getAllChatSessions();
      const latestSession = sessions.length > 0 ? sessions[0] : null;
      
      return res.status(200).json(latestSession || { id: null, messages: [] });
    }
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}