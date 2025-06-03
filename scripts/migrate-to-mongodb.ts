import fs from 'fs';
import path from 'path';
import { connectToDatabase } from '../src/services/database';
import { Card } from '../src/types/card';
import { ChatSession, ChatMessage } from '../src/types/chat';

interface LegacyCard {
  id?: string;
  front: string;
  back: string;
  audioPath?: string;
  lastReviewed?: string | Date;
  nextReviewDue?: string | Date;
  reviewCount: number;
  correctCount: number;
  easeFactor: number;
  interval: number;
  repetitions: number;
}

interface LegacyMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string | Date;
  toolCalls?: unknown[];
}

interface LegacySession {
  id?: string;
  messages: LegacyMessage[];
  language: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

async function migrateUserCards(username: string) {
    console.log(process.cwd());
  const dataDir = path.join(process.cwd(), 'data', username);
  const cardsFile = path.join(dataDir, 'cards.json');

  if (!fs.existsSync(cardsFile)) {
    console.log(`No cards file found for user: ${username}`);
    return;
  }

  try {
    const data = fs.readFileSync(cardsFile, 'utf-8');
    const { cards } = JSON.parse(data);

    if (!cards || cards.length === 0) {
      console.log(`No cards found for user: ${username}`);
      return;
    }

    const db = await connectToDatabase();
    const collection = db.collection<Card>('cards');

    const existingCount = await collection.countDocuments({ username });
    if (existingCount > 0) {
      console.log(`User ${username} already has ${existingCount} cards in database. Skipping migration.`);
      return;
    }

    const cardsToInsert = cards.map((card: LegacyCard) => ({
      ...card,
      id: card.id || new Date().getTime().toString(),
      username,
      lastReviewed: card.lastReviewed ? new Date(card.lastReviewed) : undefined,
      nextReviewDue: card.nextReviewDue ? new Date(card.nextReviewDue) : undefined
    }));

    await collection.insertMany(cardsToInsert);
    console.log(`Migrated ${cardsToInsert.length} cards for user: ${username}`);

  } catch (error) {
    console.error(`Error migrating cards for user ${username}:`, error);
  }
}

async function migrateUserChatSessions(username: string) {
  const dataDir = path.join(process.cwd(), 'data', username);
  const chatSessionsDir = path.join(dataDir, 'chat-sessions');

  if (!fs.existsSync(chatSessionsDir)) {
    console.log(`No chat sessions directory found for user: ${username}`);
    return;
  }

  try {
    const sessionFiles = fs.readdirSync(chatSessionsDir).filter(file => file.endsWith('.json'));

    if (sessionFiles.length === 0) {
      console.log(`No chat session files found for user: ${username}`);
      return;
    }

    const db = await connectToDatabase();
    const collection = db.collection<ChatSession>('chatSessions');

    const existingCount = await collection.countDocuments({ username });
    if (existingCount > 0) {
      console.log(`User ${username} already has ${existingCount} chat sessions in database. Skipping migration.`);
      return;
    }

    const sessionsToInsert: ChatSession[] = [];

    for (const file of sessionFiles) {
      const sessionFile = path.join(chatSessionsDir, file);
      const sessionData = fs.readFileSync(sessionFile, 'utf-8');
      const session = JSON.parse(sessionData) as LegacySession;

      const sessionToInsert: ChatSession = {
        ...session,
        id: session.id || path.basename(file, '.json'),
        username,
        createdAt: session.createdAt ? new Date(session.createdAt) : new Date(),
        updatedAt: session.updatedAt ? new Date(session.updatedAt) : new Date(),
        messages: session.messages.map((msg: LegacyMessage): ChatMessage => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.timestamp),
          toolCalls: msg.toolCalls as ChatMessage['toolCalls']
        }))
      };

      sessionsToInsert.push(sessionToInsert);
    }

    if (sessionsToInsert.length > 0) {
      await collection.insertMany(sessionsToInsert);
      console.log(`Migrated ${sessionsToInsert.length} chat sessions for user: ${username}`);
    }

  } catch (error) {
    console.error(`Error migrating chat sessions for user ${username}:`, error);
  }
}

async function migrateAllUsers() {
  const dataDir = path.join(process.cwd(), 'data');
  
  if (!fs.existsSync(dataDir)) {
    console.log('No data directory found');
    return;
  }

  const entries = fs.readdirSync(dataDir, { withFileTypes: true });
  const userDirs = entries.filter(entry => entry.isDirectory()).map(entry => entry.name);

  for (const username of userDirs) {
    await migrateUserCards(username);
    await migrateUserChatSessions(username);
  }

  console.log('Migration completed');
}

if (require.main === module) {
  migrateAllUsers()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

export { migrateUserCards, migrateUserChatSessions, migrateAllUsers };