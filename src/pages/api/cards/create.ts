import type { NextApiRequest, NextApiResponse } from 'next';
import { addCard } from '@/services/cardService';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { front, back } = req.body;
      
      if (!front || !back) {
        return res.status(400).json({ error: 'Front and back text are required' });
      }
      
      const newCard = addCard({ front, back });
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