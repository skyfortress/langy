import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { Card } from "../types/card";
import { z } from "zod/v4";
import { tool } from "@langchain/core/tools";

export const createGeminiModel = (temperature: number = 0.7) => {
  return new ChatGoogleGenerativeAI({
    model: 'gemini-3.5-flash',
    temperature,
  });
};

const extractCardsSchema = z.object({
  cards: z.array(z.object({
    front: z.string().describe("Portuguese word or phrase"),
    back: z.string().describe("English translation")
  })).describe("Array of flashcards to create")
});

export const extractCardsTool = tool(
  (input: unknown) => {
    const { cards } = extractCardsSchema.parse(input);
    return { success: true, cards };
  },
  {
    name: "extractCards",
    description: "Extract flashcards from the provided text",
    schema: extractCardsSchema as never
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
