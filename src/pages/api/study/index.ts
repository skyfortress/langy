import type { NextApiRequest, NextApiResponse } from 'next';
import { getCardsForReview } from '@/services/cardService';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const cards = getCardsForReview();
      
      // Randomize the order of cards
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