import type { NextApiRequest, NextApiResponse } from 'next';
import { deleteCard } from '@/services/cardService';

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { cardId } = req.query;
  
  if (req.method === 'DELETE') {
    try {
      if (!cardId || Array.isArray(cardId)) {
        return res.status(400).json({ error: 'Valid card ID is required' });
      }
      
      deleteCard(cardId);
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