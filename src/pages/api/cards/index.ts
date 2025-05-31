import { NextApiResponse } from 'next';
import { CardService } from '@/services/cardService';
import { withAuth, AuthenticatedRequest } from '@/utils/auth';

function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const { username } = req.user;
  const cardService = new CardService(username);

  if (req.method === 'GET') {
    try {
      const cards = cardService.getAllCards();
      res.status(200).json(cards);
    } catch (error) {
      console.error('Error fetching cards:', error);
      res.status(500).json({ error: 'Failed to fetch cards' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

export default withAuth(handler);