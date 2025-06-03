import { ObjectId } from 'mongodb';
import { Card, ReviewQuality } from '@/types/card';
import { generatePortugueseAudio } from './ttsService';
import { connectToDatabase } from './database';

const DEFAULT_EASE_FACTOR = 2.5;
const MIN_EASE_FACTOR = 1.3;
const CARDS_COLLECTION = 'cards';

export class CardService {
  private username: string;

  constructor(username: string) {
    this.username = username;
  }

  async getAllCards(): Promise<Card[]> {
    const db = await connectToDatabase();
    const collection = db.collection<Card>(CARDS_COLLECTION);
    
    const cards = await collection.find({ username: this.username }).toArray();
    return cards.map(card => ({
      ...card,
      id: card.id || card._id?.toString() || ''
    }));
  }

  async addCard(card: Omit<Card, 'id' | 'reviewCount' | 'correctCount' | 'easeFactor' | 'interval' | 'repetitions' | 'audioPath' | 'username'>): Promise<Card> {
    const db = await connectToDatabase();
    const collection = db.collection<Card>(CARDS_COLLECTION);
    
    const newCard: Card = {
      ...card,
      id: new ObjectId().toString(),
      username: this.username,
      reviewCount: 0,
      correctCount: 0,
      easeFactor: DEFAULT_EASE_FACTOR,
      interval: 0,
      repetitions: 0
    };
    
    await collection.insertOne(newCard);
    return newCard;
  }

  async updateCard(card: Card): Promise<Card> {
    const db = await connectToDatabase();
    const collection = db.collection<Card>(CARDS_COLLECTION);
    
    const result = await collection.updateOne(
      { id: card.id, username: this.username },
      { $set: { ...card, username: this.username } }
    );
    
    if (result.matchedCount === 0) {
      throw new Error(`Card with ID ${card.id} not found`);
    }
    
    return card;
  }

  async deleteCard(id: string): Promise<void> {
    const db = await connectToDatabase();
    const collection = db.collection<Card>(CARDS_COLLECTION);
    
    const result = await collection.deleteOne({ id, username: this.username });
    
    if (result.deletedCount === 0) {
      throw new Error(`Card with ID ${id} not found`);
    }
  }

  async getCardsForReview(): Promise<Card[]> {
    const cards = await this.getAllCards();
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

  async recordReview(cardId: string, correct: boolean, quality?: ReviewQuality): Promise<Card> {
    const cards = await this.getAllCards();
    const card = cards.find(c => c.id === cardId);
    
    if (!card) {
      throw new Error(`Card with ID ${cardId} not found`);
    }
    
    const responseQuality = quality !== undefined 
      ? quality 
      : correct 
        ? ReviewQuality.CorrectWithSomeHesitation 
        : ReviewQuality.CompleteBlackout;
    
    const updatedCard = this.calculateSM2Parameters(card, responseQuality);
    await this.updateCard(updatedCard);
    
    return updatedCard;
  }

  async getStudyStatistics() {
    const cards = await this.getAllCards();
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

  async getCardStats() {
    const cards = await this.getAllCards();
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