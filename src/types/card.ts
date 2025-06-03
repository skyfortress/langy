import { ObjectId } from 'mongodb';

export interface Card {
  id: string;
  _id?: ObjectId;
  username: string; // New property for username
  front: string; // Portuguese
  back: string;  // English
  audioFileId?: string; // New property for GridFS audio file ID
  lastReviewed?: Date;
  nextReviewDue?: Date;
  reviewCount: number;
  correctCount: number;
  // SM-2 specific properties
  easeFactor: number; // E-Factor in SM-2 algorithm (starts at 2.5)
  interval: number;   // Current interval in days
  repetitions: number; // Number of successful repetitions in a row (for SM-2)
}

// SM-2 quality response scale (0-5)
export enum ReviewQuality {
  CompleteBlackout = 0,  // Complete blackout, wrong response
  IncorrectButRecognized = 1, // Incorrect response, but upon seeing the answer recognized it
  IncorrectButEasyRecall = 2, // Incorrect response, but answer was easy to recall once shown
  CorrectWithDifficulty = 3, // Correct response, but required significant effort
  CorrectWithSomeHesitation = 4, // Correct response after a slight hesitation
  PerfectRecall = 5 // Perfect response
}

export interface CardReviewResult {
  id: string;
  correct: boolean;
  mode: 'front-to-back' | 'back-to-front';
  quality?: ReviewQuality; // SM-2 quality rating
}

export interface StudySession {
  cards: Card[];
  currentCardIndex: number;
  mode: 'front-to-back' | 'back-to-front';
}