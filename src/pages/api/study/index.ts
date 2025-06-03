import { NextApiResponse } from 'next';
import { CardService } from '@/services/cardService';
import { withAuth, AuthenticatedRequest } from '@/utils/auth';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const { username } = req.user;
  const cardService = new CardService(username);

  if (req.method === 'GET') {
    try {
      const cards = await cardService.getCardsForReview();
      
      const shuffledCards = [...cards].sort(() => Math.random() - 0.5);
      
      res.status(200).json({
        cards: shuffledCards,
        currentCardIndex: 0,
        mode: Math.random() < 0.5 ? 'front-to-back' : 'back-to-front'
      });
    } catch (error) {
      console.error('Error fetching study session:', error);
      res.status(500).json({ error: 'Failed to fetch study session' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

export default withAuth(handler);