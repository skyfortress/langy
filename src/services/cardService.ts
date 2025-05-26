import fs from 'fs';
import path from 'path';
import { Card, ReviewQuality } from '@/types/card';

// File path for storing cards
const DATA_DIR = path.join(process.cwd(), 'data');
const CARDS_FILE = path.join(DATA_DIR, 'cards.json');

// SM-2 algorithm constants
const DEFAULT_EASE_FACTOR = 2.5;
const MIN_EASE_FACTOR = 1.3;

// Ensure data directory exists
const ensureDataDir = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  
  if (!fs.existsSync(CARDS_FILE)) {
    fs.writeFileSync(CARDS_FILE, JSON.stringify({ cards: [] }, null, 2));
  }
};

// Get all cards
export const getAllCards = (): Card[] => {
  ensureDataDir();
  const data = fs.readFileSync(CARDS_FILE, 'utf-8');
  return JSON.parse(data).cards;
};

// Add a new card
export const addCard = (card: Omit<Card, 'id' | 'reviewCount' | 'correctCount' | 'easeFactor' | 'interval' | 'repetitions'>): Card => {
  const cards = getAllCards();
  
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
  fs.writeFileSync(CARDS_FILE, JSON.stringify({ cards }, null, 2));
  
  return newCard;
};

// Update a card
export const updateCard = (card: Card): Card => {
  const cards = getAllCards();
  const index = cards.findIndex(c => c.id === card.id);
  
  if (index === -1) {
    throw new Error(`Card with ID ${card.id} not found`);
  }
  
  cards[index] = card;
  fs.writeFileSync(CARDS_FILE, JSON.stringify({ cards }, null, 2));
  
  return card;
};

// Delete a card
export const deleteCard = (id: string): void => {
  const cards = getAllCards().filter(card => card.id !== id);
  fs.writeFileSync(CARDS_FILE, JSON.stringify({ cards }, null, 2));
};

// Get cards due for review (or all if none are due)
export const getCardsForReview = (): Card[] => {
  const cards = getAllCards();
  const now = new Date();
  
  // Get cards due for review (cards with no review date or due date in the past)
  const dueCards = cards.filter(card => 
    !card.nextReviewDue || new Date(card.nextReviewDue) <= now
  );
  
  // If no cards are due, return all cards
  return dueCards.length > 0 ? dueCards : cards;
};

/**
 * Calculate the next interval using the SM-2 algorithm
 * @param card The card being reviewed
 * @param quality The quality of the response (0-5)
 * @returns The updated card with new SM-2 values
 */
const calculateSM2Parameters = (card: Card, quality: ReviewQuality): Card => {
  const updatedCard = { ...card };
  
  // Update review and correct count
  updatedCard.reviewCount += 1;
  if (quality >= ReviewQuality.CorrectWithDifficulty) {
    updatedCard.correctCount += 1;
  }
  
  // Calculate new ease factor
  // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  const qualityAdjustment = 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
  updatedCard.easeFactor = Math.max(MIN_EASE_FACTOR, updatedCard.easeFactor + qualityAdjustment);
  
  // SM-2 Algorithm logic
  if (quality < ReviewQuality.CorrectWithDifficulty) {
    // If response was incorrect, reset repetitions but keep ease factor
    updatedCard.repetitions = 0;
    updatedCard.interval = 1; // Review again tomorrow
  } else {
    // If response was correct, increase repetitions
    updatedCard.repetitions += 1;
    
    // Calculate new interval based on repetitions
    if (updatedCard.repetitions === 1) {
      updatedCard.interval = 1; // First correct answer: 1 day
    } else if (updatedCard.repetitions === 2) {
      updatedCard.interval = 6; // Second correct answer: 6 days
    } else {
      // For repetitions > 2: I(n) = I(n-1) * EF
      updatedCard.interval = Math.round(updatedCard.interval * updatedCard.easeFactor);
    }
  }
  
  // Calculate the next review date
  const now = new Date();
  const nextDate = new Date(now);
  nextDate.setDate(nextDate.getDate() + updatedCard.interval);
  updatedCard.nextReviewDue = nextDate;
  updatedCard.lastReviewed = now;
  
  return updatedCard;
};

// Record a review result using SM-2 algorithm
export const recordReview = (cardId: string, correct: boolean, quality?: ReviewQuality): Card => {
  const cards = getAllCards();
  const index = cards.findIndex(c => c.id === cardId);
  
  if (index === -1) {
    throw new Error(`Card with ID ${cardId} not found`);
  }
  
  // If quality is not provided, estimate it based on correct/incorrect
  const responseQuality = quality !== undefined 
    ? quality 
    : correct 
      ? ReviewQuality.CorrectWithSomeHesitation 
      : ReviewQuality.CompleteBlackout;
  
  // Calculate new SM-2 parameters
  cards[index] = calculateSM2Parameters(cards[index], responseQuality);
  
  // Save updated cards
  fs.writeFileSync(CARDS_FILE, JSON.stringify({ cards }, null, 2));
  
  return cards[index];
};

// Get study statistics for the user
export const getStudyStatistics = () => {
  const cards = getAllCards();
  const totalCards = cards.length;
  const cardsReviewed = cards.filter(card => card.reviewCount > 0).length;
  const totalReviews = cards.reduce((sum, card) => sum + card.reviewCount, 0);
  const correctReviews = cards.reduce((sum, card) => sum + card.correctCount, 0);
  const accuracyRate = totalReviews > 0 ? (correctReviews / totalReviews) * 100 : 0;
  
  // Calculate how many cards are due in the next 7 days
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
    accuracyRate: Math.round(accuracyRate * 10) / 10, // Round to 1 decimal place
    dueIn7Days
  };
};