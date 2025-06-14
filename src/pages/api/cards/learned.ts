import { NextApiResponse } from 'next';
import { CardService } from '@/services/cardService';
import { withAuth, AuthenticatedRequest } from '@/utils/auth';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const { username } = req.user;
  const cardService = new CardService(username);

  if (req.method === 'GET') {
    try {
      const cards = await cardService.getAllCards();
      const learnedCards = cards.filter(card => 
        card.reviewCount > 0 && card.repetitions > 1
      );
      
      res.status(200).json(learnedCards);
    } catch (error) {
      console.error('Error fetching learned cards:', error);
      res.status(500).json({ error: 'Failed to fetch learned cards' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

export default withAuth(handler);