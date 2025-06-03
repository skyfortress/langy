import { NextApiResponse } from 'next';
import { generatePortugueseAudio } from '@/services/ttsService';
import { CardService } from '@/services/cardService';
import { withAuth, AuthenticatedRequest } from '@/utils/auth';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { username } = req.user;
      const cardService = new CardService(username);
      const { cardId } = req.query;
      
      if (!cardId || Array.isArray(cardId)) {
        return res.status(400).json({ success: false, error: 'Valid card ID is required' });
      }
      
      const cards = await cardService.getAllCards();
      const card = cards.find(c => c.id === cardId);
      
      if (!card) {
        return res.status(404).json({ success: false, error: 'Card not found' });
      }
      
      const parts = card.front.split('/');
      const textToGenerate = parts[parts.length -1];
      
      const audioResponse = await generatePortugueseAudio(textToGenerate, username);
      
      if (audioResponse.error) {
        return res.status(500).json({ 
          success: false, 
          error: audioResponse.error 
        });
      }
      
      if (audioResponse.audioFileId) {
        card.audioFileId = audioResponse.audioFileId;
        await cardService.updateCard(card);
        
        return res.status(200).json({ 
          success: true, 
          audioFileId: audioResponse.audioFileId
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