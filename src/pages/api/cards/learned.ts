import type { NextApiRequest, NextApiResponse } from 'next';
import { getAllCards } from '@/services/cardService';
import { Card } from '@/types/card';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const cards = getAllCards();
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