import { NextApiResponse } from 'next';
import { generatePortugueseAudio } from '@/services/ttsService';
import { CardService } from '@/services/cardService';
import { withAuth, AuthenticatedRequest } from '@/utils/auth';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { username } = req.user;
      const cardService = new CardService(username);
      const { id, text } = req.body;
      
      if (!id || !text) {
        return res.status(400).json({ error: 'Card ID and text are required' });
      }
      
      const cards = cardService.getAllCards();
      const card = cards.find(c => c.id === id);
      
      if (!card) {
        return res.status(404).json({ error: 'Card not found' });
      }
      
      const audioResponse = await generatePortugueseAudio(text, username);
      
      if (audioResponse.error) {
        return res.status(500).json({ 
          success: false, 
          error: audioResponse.error 
        });
      }
      
      if (audioResponse.audioPath) {
        card.audioPath = audioResponse.audioPath;
        cardService.updateCard(card);
        
        return res.status(200).json({ 
          success: true, 
          audioPath: audioResponse.audioPath 
        });
      } else {
        return res.status(500).json({
          success: false,
          error: 'Failed to generate audio'
        });
      }
    } catch (error) {
      console.error('Error generating audio for card:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to generate audio' 
      });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

export default withAuth(handler);