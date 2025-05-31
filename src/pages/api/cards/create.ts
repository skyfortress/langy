import { NextApiResponse } from 'next';
import { CardService } from '@/services/cardService';
import { withAuth, AuthenticatedRequest } from '@/utils/auth';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const { username } = req.user;
  const cardService = new CardService(username);

  if (req.method === 'POST') {
    try {
      const { front, back } = req.body;
      
      if (!front || !back) {
        return res.status(400).json({ error: 'Front and back text are required' });
      }
      
      const newCard = await cardService.addCard({ front, back });
      res.status(201).json(newCard);
    } catch (error) {
      console.error('Error creating card:', error);
      res.status(500).json({ error: 'Failed to create card' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

export default withAuth(handler);