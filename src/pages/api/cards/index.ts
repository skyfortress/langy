import type { NextApiRequest, NextApiResponse } from 'next';
import { getAllCards } from '@/services/cardService';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const cards = getAllCards();
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