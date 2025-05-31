import { NextApiResponse } from 'next';
import { CardService } from '@/services/cardService';
import { CardReviewResult, ReviewQuality } from '@/types/card';
import { withAuth, AuthenticatedRequest } from '@/utils/auth';

function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const { username } = req.user;
  const cardService = new CardService(username);

  if (req.method === 'POST') {
    try {
      const { id, correct, mode, quality }: CardReviewResult = req.body;
      
      if (!id) {
        return res.status(400).json({ error: 'Card ID is required' });
      }
      
      if (typeof correct !== 'boolean') {
        return res.status(400).json({ error: 'Correct status is required (true/false)' });
      }
      
      if (quality !== undefined && (quality < 0 || quality > 5)) {
        return res.status(400).json({ error: 'Quality must be between 0 and 5' });
      }
      
      const updatedCard = cardService.recordReview(id, correct, quality);
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

export default withAuth(handler);