import { NextApiResponse } from 'next';
import { generateFlashcardsFromText } from '@/services/aiService';
import { CardService } from '@/services/cardService';
import { withAuth, AuthenticatedRequest } from '@/utils/auth';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { username } = req.user;
    const cardService = new CardService(username);
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ message: 'Text input is required' });
    }

    const cards = await cardService.getAllCards();
    const uniqueCards = await generateFlashcardsFromText(text, cards);

    const createdCards = [];
    for (const cardData of uniqueCards) {
      try {
        const newCard = await cardService.addCard({
          front: cardData.front.trim(),
          back: cardData.back.trim()
        });
        createdCards.push(newCard);
      } catch (error) {
        console.error('Error creating card:', error);
      }
    }

    res.status(200).json({
      message: `Generated ${createdCards.length} new cards`,
      cards: createdCards
    });
  } catch (error) {
    console.error('Error generating cards:', error);
    res.status(500).json({ message: 'Failed to generate cards' });
  }
}

export default withAuth(handler);