import type { NextApiRequest, NextApiResponse } from 'next';
import { generatePortugueseAudio } from '@/services/ttsService';
import { getAllCards, updateCard } from '@/services/cardService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { id, text } = req.body;
      
      if (!id || !text) {
        return res.status(400).json({ error: 'Card ID and text are required' });
      }
      
      // Find the card
      const cards = getAllCards();
      const card = cards.find(c => c.id === id);
      
      if (!card) {
        return res.status(404).json({ error: 'Card not found' });
      }
      
      // Generate audio
      const audioResponse = await generatePortugueseAudio(text);
      
      if (audioResponse.error) {
        return res.status(500).json({ 
          success: false, 
          error: audioResponse.error 
        });
      }
      
      // Update card with audio path
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