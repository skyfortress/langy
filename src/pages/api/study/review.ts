import type { NextApiRequest, NextApiResponse } from 'next';
import { recordReview } from '@/services/cardService';
import { CardReviewResult, ReviewQuality } from '@/types/card';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { id, correct, mode, quality }: CardReviewResult = req.body;
      
      if (!id) {
        return res.status(400).json({ error: 'Card ID is required' });
      }
      
      if (typeof correct !== 'boolean') {
        return res.status(400).json({ error: 'Correct status is required (true/false)' });
      }
      
      // Check if quality is a valid ReviewQuality value (0-5)
      if (quality !== undefined && (quality < 0 || quality > 5)) {
        return res.status(400).json({ error: 'Quality must be between 0 and 5' });
      }
      
      const updatedCard = recordReview(id, correct, quality);
      res.status(200).json(updatedCard);
    } catch (error) {
      console.error('Error recording review:', error);
      res.status(500).json({ error: 'Failed to record review' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}