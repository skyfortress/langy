export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  toolCalls?: ToolCall[];
}

export interface ToolCall {
  id: string;
  type: string;
  name: string;
  args: CreateCardParameters;
}

export interface CreateCardParameters {
  word: string;
  translation: string;
  context?: string;
}

export interface ProcessedToolCall {
  id: string;
  type: string;
  name: string;
  status: 'success' | 'error';
  result?: unknown;
  error?: string;
}

export interface ApiResponse {
  userMessage: ChatMessage;
  assistantMessage: ChatMessage;
  processedToolCalls: ProcessedToolCall[];
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