import type { NextApiRequest, NextApiResponse } from 'next';
import { getCardStats } from '@/services/cardService';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const stats = getCardStats();
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