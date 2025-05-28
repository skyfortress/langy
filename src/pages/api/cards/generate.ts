import type { NextApiRequest, NextApiResponse } from 'next';
import { generateFlashcardsFromText } from '@/services/aiService';
import { addCard } from '@/services/cardService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ message: 'Text input is required' });
    }

    const uniqueCards = await generateFlashcardsFromText(text);

    const createdCards = [];
    for (const cardData of uniqueCards) {
      try {
        const newCard = await addCard({
          front: cardData.front.trim(),
          back: cardData.back.trim()
        });
        createdCards.push(newCard);
      } catch (error) {
        console.error('Error creating card:', error);
      }
    }

    res.status(200).json({
      message: `Successfully created ${createdCards.length} flashcard(s)`,
      cards: createdCards,
      count: createdCards.length
    });

  } catch (error) {
    console.error('Error generating flashcards:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate flashcards';
    res.status(500).json({ message: errorMessage });
  }
}