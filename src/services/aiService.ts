import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";
import { ChatMessage, ChatCompletionRequest, ChatCompletionResponse, ToolCall, CreateCardParameters } from "../types/chat";
import { Card } from "../types/card";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { tool } from "@langchain/core/tools";

export const createGeminiModel = (temperature: number = 0.7) => {
  return new ChatGoogleGenerativeAI({
    model: 'gemini-2.5-flash-preview-04-17',
    temperature,
  });
};

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

export const extractCardsTool = tool(
  ({ cards }: { cards: Array<{ front: string; back: string; }> }) => {
    return { success: true, cards };
  },
  {
    name: "extractCards",
    description: "Extract flashcards from the provided text",
    schema: z.object({
      cards: z.array(z.object({
        front: z.string().describe("Portuguese word or phrase"),
        back: z.string().describe("English translation")
      })).describe("Array of flashcards to create")
    })
  }
);

const formatFlashcardsContext = (cards: Card[]) => {
  if (!cards || cards.length === 0) {
    return "";
  }
  
  const flashcardEntries = cards.map(card => `${card.front} = ${card.back}`);
  
  return `
Here are the vocabulary flashcards that the user has already created:

${flashcardEntries.join('\n')}

When responding to the user, you can refer to these existing vocabulary words. Consider these words already familiar to the user.
`;
};

export const createFlashcardExtractionPrompt = (cards: Card[]) => {
  const flashcardsContext = formatFlashcardsContext(cards);
  
  return new SystemMessage(`You are a language learning assistant that creates Portuguese flashcards from user input.

Your task is to analyze the provided text and extract Portuguese vocabulary words, phrases, or sentences that would be useful for language learning.

Guidelines:
1. Focus on Portuguese words and phrases that a learner would benefit from memorizing
2. Include the Portuguese text as the "front" of the card
3. Provide clear English translations as the "back" of the card
4. For longer text, extract 5-10 key vocabulary items
5. For vocabulary lists, create cards for each item
6. For sentences, you can create cards for both the full sentence and key vocabulary words within it
7. Prioritize commonly used words and practical phrases
8. If the input contains conjugated verbs, create cards for the base form when appropriate
9. Skip very basic words (like "a", "o", "e") unless they're part of a useful phrase
10. IMPORTANT: Do not create cards for words that already exist in the user's collection

${flashcardsContext}

Use the extractCards tool to return the flashcards you've identified.`);
};

const createLanguageLearningPrompt = (cards: Card[]) => {
  const language = 'European Portuguese';
  const flashcardsContext = formatFlashcardsContext(cards);
  
  return new SystemMessage(
    `You are a helpful language tutor for ${language}. Your primary goal is to help the user 
    learn ${language} through conversation. 
    
    Follow these guidelines:
    1. If the user writes in English, respond with both ${language} and the English translation. Try to use only known to user words.
    2. If the user writes in ${language}, gently correct any mistakes and provide the corrected version.
    3. Use simple vocabulary and gradually introduce more complex terms.
    4. Occasionally ask questions to keep the conversation going.
    5. Provide cultural context where relevant.
    6. If the user asks about grammar rules, explain them clearly with examples.
    7. If the user seems to struggle, offer encouragement and simplify your language.
    8. Identify important vocabulary words that might be new to the learner. For each new word, use the createCard tool to create a flashcard.
    9. Verbs flash cards should be created per each common conjugation, example one card is "ir - go" and other "Eu vou - I go", "Tu vais - you go" and so on.
    
    Remember, the goal is to make learning ${language} enjoyable and effective!
    
    ${flashcardsContext}`
  );
};

const convertToChatMessages = (messages: ChatMessage[]) => {
  return messages.map(msg => {
    if (msg.role === 'user') {
      return new HumanMessage(msg.content);
    } else {
      return new AIMessage(msg.content);
    }
  });
};

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

export const generateChatCompletion = async (
  request: ChatCompletionRequest,
  cards: Card[]
): Promise<ChatCompletionResponse> => {
  try {
    const { message, chatHistory = [] } = request;
    
    const model = createGeminiModel();
    const modelWithTools = model.bindTools([createCardTool]);
    
    const systemPrompt = createLanguageLearningPrompt(cards);
    const langchainMessages = [systemPrompt, ...convertToChatMessages(chatHistory), new HumanMessage(message)];
    
    const response = await modelWithTools.invoke(langchainMessages);
    const toolCalls = extractToolCalls(response);
    
    const chatResponse: ChatMessage = {
      id: uuidv4(),
      role: 'assistant',
      content: Array.isArray(response.content) ? 
        (response.content.find(el => el.type === 'text') as TextContent)?.text || response.content.toString() : 
        response.content.toString(),
      timestamp: new Date(),
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined
    };
    
    return { message: chatResponse };
  } catch (error) {
    console.error("Error generating chat completion:", error);
    throw error;
  }
};

export const generateFlashcardsFromText = async (text: string, cards: Card[]) => {
  const model = createGeminiModel(0.3);
  const modelWithTools = model.bindTools([extractCardsTool]);
  
  const systemPrompt = createFlashcardExtractionPrompt(cards);
  
  const response = await modelWithTools.invoke([
    systemPrompt,
    new HumanMessage(`Please analyze this text and create Portuguese flashcards: ${text}`)
  ]);

  if (!response.tool_calls || response.tool_calls.length === 0) {
    throw new Error('No flashcards could be generated from the provided text. Please try with Portuguese text or vocabulary.');
  }

  const toolCall = response.tool_calls[0];
  const extractedCards = toolCall.args as { cards: Array<{ front: string; back: string; }> };

  if (!extractedCards.cards || extractedCards.cards.length === 0) {
    throw new Error('No suitable vocabulary found in the text for flashcard creation.');
  }

  return extractedCards.cards;
};

interface TextContent {
  type: 'text';
  text: string;
}