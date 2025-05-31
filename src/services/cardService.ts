import fs from 'fs';
import path from 'path';
import { Card, ReviewQuality } from '@/types/card';
import { generatePortugueseAudio } from './ttsService';

// SM-2 algorithm constants
const DEFAULT_EASE_FACTOR = 2.5;
const MIN_EASE_FACTOR = 1.3;

export class CardService {
  private dataDir: string;
  private cardsFile: string;

  constructor(username: string) {
    this.dataDir = path.join(process.cwd(), 'data', username);
    this.cardsFile = path.join(this.dataDir, 'cards.json');
    this.ensureDataDir();
  }

  private ensureDataDir(): void {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
    
    if (!fs.existsSync(this.cardsFile)) {
      fs.writeFileSync(this.cardsFile, JSON.stringify({ cards: [] }, null, 2));
    }
  }

  getAllCards(): Card[] {
    this.ensureDataDir();
    const data = fs.readFileSync(this.cardsFile, 'utf-8');
    return JSON.parse(data).cards;
  }

  async addCard(card: Omit<Card, 'id' | 'reviewCount' | 'correctCount' | 'easeFactor' | 'interval' | 'repetitions' | 'audioPath'>): Promise<Card> {
    const cards = this.getAllCards();
    
    const newCard: Card = {
      ...card,
      id: Date.now().toString(),
      reviewCount: 0,
      correctCount: 0,
      easeFactor: DEFAULT_EASE_FACTOR,
      interval: 0,
      repetitions: 0
    };
    
    cards.push(newCard);
    fs.writeFileSync(this.cardsFile, JSON.stringify({ cards }, null, 2));
    

    // generatePortugueseAudio(card.front, username)
    //   .then(audioResponse => {
    //     if (audioResponse.audioPath) {
    //       newCard.audioPath = audioResponse.audioPath;
    //       this.updateCard(newCard);
    //     }
    //   })
    //   .catch(error => {
    //     console.error('Failed to generate audio:', error);
    //   });
    
    return newCard;
  }

  updateCard(card: Card): Card {
    const cards = this.getAllCards();
    const index = cards.findIndex(c => c.id === card.id);
    
    if (index === -1) {
      throw new Error(`Card with ID ${card.id} not found`);
    }
    
    cards[index] = card;
    fs.writeFileSync(this.cardsFile, JSON.stringify({ cards }, null, 2));
    
    return card;
  }

  deleteCard(id: string): void {
    const cards = this.getAllCards().filter(card => card.id !== id);
    fs.writeFileSync(this.cardsFile, JSON.stringify({ cards }, null, 2));
  }

  getCardsForReview(): Card[] {
    const cards = this.getAllCards();
    const now = new Date();
    
    const dueCards = cards.filter(card => 
      !card.nextReviewDue || new Date(card.nextReviewDue) <= now
    );
    
    return dueCards.length > 0 ? dueCards : cards;
  }

  private calculateSM2Parameters(card: Card, quality: ReviewQuality): Card {
    const updatedCard = { ...card };
    
    updatedCard.reviewCount += 1;
    if (quality >= ReviewQuality.CorrectWithDifficulty) {
      updatedCard.correctCount += 1;
    }
    
    const qualityAdjustment = 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
    updatedCard.easeFactor = Math.max(MIN_EASE_FACTOR, updatedCard.easeFactor + qualityAdjustment);
    
    if (quality < ReviewQuality.CorrectWithDifficulty) {
      updatedCard.repetitions = 0;
      updatedCard.interval = 1;
    } else {
      updatedCard.repetitions += 1;
      
      if (updatedCard.repetitions === 1) {
        updatedCard.interval = 1;
      } else if (updatedCard.repetitions === 2) {
        updatedCard.interval = 6;
      } else {
        updatedCard.interval = Math.round(updatedCard.interval * updatedCard.easeFactor);
      }
    }
    
    const now = new Date();
    const nextDate = new Date(now);
    nextDate.setDate(nextDate.getDate() + updatedCard.interval);
    updatedCard.nextReviewDue = nextDate;
    updatedCard.lastReviewed = now;
    
    return updatedCard;
  }

  recordReview(cardId: string, correct: boolean, quality?: ReviewQuality): Card {
    const cards = this.getAllCards();
    const index = cards.findIndex(c => c.id === cardId);
    
    if (index === -1) {
      throw new Error(`Card with ID ${cardId} not found`);
    }
    
    const responseQuality = quality !== undefined 
      ? quality 
      : correct 
        ? ReviewQuality.CorrectWithSomeHesitation 
        : ReviewQuality.CompleteBlackout;
    
    cards[index] = this.calculateSM2Parameters(cards[index], responseQuality);
    
    fs.writeFileSync(this.cardsFile, JSON.stringify({ cards }, null, 2));
    
    return cards[index];
  }

  getStudyStatistics() {
    const cards = this.getAllCards();
    const totalCards = cards.length;
    const cardsReviewed = cards.filter(card => card.reviewCount > 0).length;
    const totalReviews = cards.reduce((sum, card) => sum + card.reviewCount, 0);
    const correctReviews = cards.reduce((sum, card) => sum + card.correctCount, 0);
    const accuracyRate = totalReviews > 0 ? (correctReviews / totalReviews) * 100 : 0;
    
    const now = new Date();
    const next7Days = new Date(now);
    next7Days.setDate(next7Days.getDate() + 7);
    
    const dueIn7Days = cards.filter(card => 
      card.nextReviewDue && 
      new Date(card.nextReviewDue) > now && 
      new Date(card.nextReviewDue) <= next7Days
    ).length;
    
    return {
      totalCards,
      cardsReviewed,
      totalReviews,
      correctReviews,
      accuracyRate: Math.round(accuracyRate * 10) / 10,
      dueIn7Days
    };
  }

  getCardStats() {
    const cards = this.getAllCards();
    const now = new Date();
    
    const newCards = cards.filter(card => card.reviewCount === 0);
    const dueCards = cards.filter(card => 
      card.nextReviewDue && new Date(card.nextReviewDue) <= now && card.repetitions > 1
    );
    const learningCards = cards.filter(card => 
      card.reviewCount > 0 && card.repetitions <= 1
    );
    const learnedCards = cards.filter(card => 
      card.reviewCount > 0 && card.repetitions > 1
    );

    return {
      new: newCards.length,
      learn: learningCards.length,
      due: dueCards.length,
      learned: learnedCards.length
    };
  }
}