import type { NextApiRequest, NextApiResponse } from 'next';
import { generatePortugueseAudio } from '@/services/ttsService';
import { getAllCards, updateCard } from '@/services/cardService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { cardId } = req.query;
      
      if (!cardId || Array.isArray(cardId)) {
        return res.status(400).json({ success: false, error: 'Valid card ID is required' });
      }
      
      const cards = getAllCards();
      const card = cards.find(c => c.id === cardId);
      
      if (!card) {
        return res.status(404).json({ success: false, error: 'Card not found' });
      }
      
      const textToGenerate = card.front;
      
      const audioResponse = await generatePortugueseAudio(textToGenerate);
      
      if (audioResponse.error) {
        return res.status(500).json({ 
          success: false, 
          error: audioResponse.error 
        });
      }
      
      if (audioResponse.audioPath) {
        card.audioPath = audioResponse.audioPath;
        updateCard(card);
        
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