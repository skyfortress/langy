import { NextApiResponse } from 'next';
import { CardService } from '@/services/cardService';
import { withAuth, AuthenticatedRequest } from '@/utils/auth';

async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse
) {
  const { cardId } = req.query;
  const { username } = req.user;
  const cardService = new CardService(username);
  
  if (req.method === 'DELETE') {
    try {
      if (!cardId || Array.isArray(cardId)) {
        return res.status(400).json({ error: 'Valid card ID is required' });
      }
      
      await cardService.deleteCard(cardId);
      res.status(200).json({ message: 'Card deleted successfully' });
    } catch (error) {
      console.error('Error deleting card:', error);
      res.status(500).json({ error: 'Failed to delete card' });
    }
  } else {
    res.setHeader('Allow', ['DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

export default withAuth(handler);