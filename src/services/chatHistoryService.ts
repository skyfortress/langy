import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ChatMessage, ChatSession } from '../types/chat';

const SESSIONS_DIR = path.join(process.cwd(), 'data', 'chat-sessions');

// Ensure sessions directory exists
const ensureSessionsDirectory = (): void => {
  if (!fs.existsSync(SESSIONS_DIR)) {
    fs.mkdirSync(SESSIONS_DIR, { recursive: true });
  }
};

// Get session file path
const getSessionFilePath = (sessionId: string): string => {
  return path.join(SESSIONS_DIR, `${sessionId}.json`);
};

// Create a new chat session
export const createChatSession = (): ChatSession => {
  ensureSessionsDirectory();
  const sessionId = uuidv4();
  
  const session: ChatSession = {
    id: sessionId,
    messages: [],
    language: 'European Portuguese',
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  fs.writeFileSync(
    getSessionFilePath(sessionId),
    JSON.stringify(session, null, 2)
  );
  
  return session;
};

// Get a chat session by ID
export const getChatSession = (sessionId: string): ChatSession | null => {
  ensureSessionsDirectory();
  const filePath = getSessionFilePath(sessionId);
  
  if (!fs.existsSync(filePath)) {
    return null;
  }
  
  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const session = JSON.parse(fileContent) as ChatSession;
    
    // Convert string dates back to Date objects
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
};

// Get all chat sessions
export const getAllChatSessions = (): ChatSession[] => {
  ensureSessionsDirectory();
  
  try {
    const files = fs.readdirSync(SESSIONS_DIR);
    const sessionFiles = files.filter(file => file.endsWith('.json'));
    
    return sessionFiles
      .map(file => {
        const sessionId = path.basename(file, '.json');
        return getChatSession(sessionId);
      })
      .filter((session): session is ChatSession => session !== null)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()); // Sort by updatedAt desc
  } catch (error) {
    console.error('Error reading chat sessions:', error);
    return [];
  }
};

// Update a chat session with new messages
export const updateChatSession = (
  sessionId: string,
  messages: ChatMessage[]
): ChatSession | null => {
  const session = getChatSession(sessionId);
  
  if (!session) {
    return null;
  }
  
  session.messages = messages;
  session.updatedAt = new Date();
  
  try {
    fs.writeFileSync(
      getSessionFilePath(sessionId),
      JSON.stringify(session, null, 2)
    );
    return session;
  } catch (error) {
    console.error(`Error updating chat session ${sessionId}:`, error);
    return null;
  }
};

// Delete a chat session
export const deleteChatSession = (sessionId: string): boolean => {
  const filePath = getSessionFilePath(sessionId);
  
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
};