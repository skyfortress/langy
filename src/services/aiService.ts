import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";
import { ChatMessage, ChatCompletionRequest, ChatCompletionResponse, ToolCall, CreateCardParameters } from "../types/chat";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { tool } from "@langchain/core/tools";

const createCardTool = tool(
  ({ word, translation, context }: CreateCardParameters) => {
    return {
      success: true,
      word,
      translation,
      context: context || null
    };
  },
  {
    name: "createCard",
    description: "Create a flashcard for a new vocabulary word",
    schema: z.object({
      word: z.string().describe("The vocabulary word in the target language"),
      translation: z.string().describe("The translation of the word in English"),
      context: z.string().optional().describe("Optional example sentence or context for the word")
    })
  }
);

// Initialize the Gemini model
const initializeGeminiModel = () => {
  return new ChatGoogleGenerativeAI({
    model: 'gemini-2.5-flash-preview-04-17',
    temperature: 0.7,
  });
};

// Create a language learning system prompt based on the target language
const createLanguageLearningPrompt = (language: string) => {
  return new SystemMessage(
    `You are a helpful language tutor for ${language}. Your primary goal is to help the user 
    learn ${language} through conversation. 
    
    Follow these guidelines:
    1. If the user writes in English, respond with both ${language} and the English translation.
    2. If the user writes in ${language}, gently correct any mistakes and provide the corrected version.
    3. Use simple vocabulary and gradually introduce more complex terms.
    4. Occasionally ask questions to keep the conversation going.
    5. Provide cultural context where relevant.
    6. If the user asks about grammar rules, explain them clearly with examples.
    7. If the user seems to struggle, offer encouragement and simplify your language.
    8. Identify important vocabulary words that might be new to the learner. For each new word, use the createCard tool to create a flashcard.
    
    Remember, the goal is to make learning ${language} enjoyable and effective!`
  );
};

// Convert ChatMessage array to Langchain message format
const convertToChatMessages = (messages: ChatMessage[]) => {
  return messages.map(msg => {
    if (msg.role === 'user') {
      return new HumanMessage(msg.content);
    } else {
      return new AIMessage(msg.content);
    }
  });
};

// Extract tool calls from the AI message
const extractToolCalls = (response: AIMessage): ToolCall[] => {
  if (!response.tool_calls || response.tool_calls.length === 0) {
    return [];
  }

  return response.tool_calls.map(toolCall => ({
    id: toolCall.id ?? uuidv4(),
    type: toolCall.type ?? 'function',
    name: toolCall.name,
    args: toolCall.args as CreateCardParameters
  }));
};

// Generate a chat completion
export const generateChatCompletion = async (
  request: ChatCompletionRequest
): Promise<ChatCompletionResponse> => {
  try {
    const { message, language, chatHistory = [] } = request;
    
    // Initialize model
    const model = initializeGeminiModel();
    const modelWithTools = model.bindTools([createCardTool]);
    
    // Create messages array for the chat
    const systemPrompt = createLanguageLearningPrompt(language);
    const langchainMessages = [systemPrompt, ...convertToChatMessages(chatHistory), new HumanMessage(message)];
    
    // Generate response
    const response = await modelWithTools.invoke(langchainMessages);
    const toolCalls = extractToolCalls(response);
    
    // Format response
    const chatResponse: ChatMessage = {
      id: uuidv4(),
      role: 'assistant',
      content: Array.isArray(response.content) ? (response.content.find(el => el.type === 'text') as any).text : response.content.toString(),
      timestamp: new Date(),
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined
    };
    
    return { message: chatResponse };
  } catch (error) {
    console.error("Error generating chat completion:", error);
    throw error;
  }
};

// Save chat session (to be implemented with a database)
export const saveChatSession = async (sessionId: string, messages: ChatMessage[]) => {
  // This would typically save to a database
  console.log(`Saving chat session ${sessionId} with ${messages.length} messages`);
  return true;
};