import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ChatMessage, ChatSession } from '../types/chat';

export class ChatHistoryService {
  private sessionsDir: string;
  
  constructor(username: string) {
    this.sessionsDir = path.join(process.cwd(), 'data', username, 'chat-sessions');
    this.ensureSessionsDirectory();
  }

  private ensureSessionsDirectory(): void {
    if (!fs.existsSync(this.sessionsDir)) {
      fs.mkdirSync(this.sessionsDir, { recursive: true });
    }
  }

  private getSessionFilePath(sessionId: string): string {
    return path.join(this.sessionsDir, `${sessionId}.json`);
  }

  createChatSession(): ChatSession {
    const sessionId = uuidv4();
    
    const session: ChatSession = {
      id: sessionId,
      messages: [],
      language: 'European Portuguese',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    fs.writeFileSync(
      this.getSessionFilePath(sessionId),
      JSON.stringify(session, null, 2)
    );
    
    return session;
  }

  getChatSession(sessionId: string): ChatSession | null {
    const filePath = this.getSessionFilePath(sessionId);
    
    if (!fs.existsSync(filePath)) {
      return null;
    }
    
    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const session = JSON.parse(fileContent) as ChatSession;
      
      session.createdAt = new Date(session.createdAt);
      session.updatedAt = new Date(session.updatedAt);
      session.messages.forEach(msg => {
        msg.timestamp = new Date(msg.timestamp);
      });
      
      return session;
    } catch (error) {
      console.error(`Error reading chat session ${sessionId}:`, error);
      return null;
    }
  }

  getAllChatSessions(): ChatSession[] {
    try {
      const files = fs.readdirSync(this.sessionsDir);
      const sessionFiles = files.filter(file => file.endsWith('.json'));
      
      return sessionFiles
        .map(file => {
          const sessionId = path.basename(file, '.json');
          return this.getChatSession(sessionId);
        })
        .filter((session): session is ChatSession => session !== null)
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    } catch (error) {
      console.error('Error reading chat sessions:', error);
      return [];
    }
  }

  updateChatSession(
    sessionId: string,
    messages: ChatMessage[]
  ): ChatSession | null {
    const session = this.getChatSession(sessionId);
    
    if (!session) {
      return null;
    }
    
    session.messages = messages;
    session.updatedAt = new Date();
    
    try {
      fs.writeFileSync(
        this.getSessionFilePath(sessionId),
        JSON.stringify(session, null, 2)
      );
      return session;
    } catch (error) {
      console.error(`Error updating chat session ${sessionId}:`, error);
      return null;
    }
  }

  deleteChatSession(sessionId: string): boolean {
    const filePath = this.getSessionFilePath(sessionId);
    
    if (!fs.existsSync(filePath)) {
      return false;
    }
    
    try {
      fs.unlinkSync(filePath);
      return true;
    } catch (error) {
      console.error(`Error deleting chat session ${sessionId}:`, error);
      return false;
    }
  }
}