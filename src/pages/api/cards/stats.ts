import { NextApiResponse } from 'next';
import { CardService } from '@/services/cardService';
import { withAuth, AuthenticatedRequest } from '@/utils/auth';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const { username } = req.user;
  const cardService = new CardService(username);

  if (req.method === 'GET') {
    try {
      const stats = await cardService.getCardStats();
      res.status(200).json(stats);
    } catch (error) {
      console.error('Error fetching card stats:', error);
      res.status(500).json({ error: 'Failed to fetch card statistics' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

export default withAuth(handler);