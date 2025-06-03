import { ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import { ChatMessage, ChatSession } from '../types/chat';
import { connectToDatabase } from './database';

const CHAT_SESSIONS_COLLECTION = 'chatSessions';

export class ChatHistoryService {
  private username: string;
  
  constructor(username: string) {
    this.username = username;
  }

  async createChatSession(): Promise<ChatSession> {
    const db = await connectToDatabase();
    const collection = db.collection<ChatSession>(CHAT_SESSIONS_COLLECTION);
    
    const session: ChatSession = {
      id: new ObjectId().toString(),
      username: this.username,
      messages: [],
      language: 'European Portuguese',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await collection.insertOne(session);
    return session;
  }

  async getChatSession(sessionId: string): Promise<ChatSession | null> {
    const db = await connectToDatabase();
    const collection = db.collection<ChatSession>(CHAT_SESSIONS_COLLECTION);
    
    const session = await collection.findOne({ 
      id: sessionId, 
      username: this.username 
    });
    
    if (!session) {
      return null;
    }
    
    return {
      ...session,
      id: session.id || session._id?.toString() || ''
    };
  }

  async getAllChatSessions(): Promise<ChatSession[]> {
    const db = await connectToDatabase();
    const collection = db.collection<ChatSession>(CHAT_SESSIONS_COLLECTION);
    
    const sessions = await collection
      .find({ username: this.username })
      .sort({ updatedAt: -1 })
      .toArray();
    
    return sessions.map(session => ({
      ...session,
      id: session.id || session._id?.toString() || ''
    }));
  }

  async updateChatSession(sessionId: string, messages: ChatMessage[]): Promise<ChatSession | null> {
    const db = await connectToDatabase();
    const collection = db.collection<ChatSession>(CHAT_SESSIONS_COLLECTION);
    
    const updatedAt = new Date();
    
    const result = await collection.updateOne(
      { id: sessionId, username: this.username },
      { 
        $set: { 
          messages, 
          updatedAt,
          username: this.username
        }
      }
    );
    
    if (result.matchedCount === 0) {
      return null;
    }
    
    return this.getChatSession(sessionId);
  }

  async deleteChatSession(sessionId: string): Promise<boolean> {
    const db = await connectToDatabase();
    const collection = db.collection<ChatSession>(CHAT_SESSIONS_COLLECTION);
    
    const result = await collection.deleteOne({ 
      id: sessionId, 
      username: this.username 
    });
    
    return result.deletedCount > 0;
  }
}