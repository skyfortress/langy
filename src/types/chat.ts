export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  language: string; // e.g., 'Portuguese'
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatCompletionRequest {
  message: string;
  language: string;
  chatHistory?: ChatMessage[];
}

export interface ChatCompletionResponse {
  message: ChatMessage;
}