import type { NextApiRequest, NextApiResponse } from 'next';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod/v4';
import { Card } from '@/types/card';
import { CardService } from '@/services/cardService';

type JsonRecord = Record<string, unknown>;

const createJsonResponse = (data: JsonRecord) => ({
  content: [
    {
      type: 'text' as const,
      text: JSON.stringify(data, null, 2),
    },
  ],
  structuredContent: data,
});

const serializeCard = (card: Card) => ({
  id: card.id,
  front: card.front,
  back: card.back,
  reviewCount: card.reviewCount,
  correctCount: card.correctCount,
  easeFactor: card.easeFactor,
  interval: card.interval,
  repetitions: card.repetitions,
  lastReviewed: card.lastReviewed ? new Date(card.lastReviewed).toISOString() : null,
  nextReviewDue: card.nextReviewDue ? new Date(card.nextReviewDue).toISOString() : null,
});

const getConfiguredCardService = () => {
  const username = process.env.MCP_USERNAME?.trim() || "skyfortress";

  return new CardService(username);
};

const createServer = () => {
  const server = new McpServer({
    name: 'langy-flashcards',
    version: '1.0.0',
  });

  server.registerTool(
    'list_flashcards',
    {
      title: 'List flashcards',
      description: 'List Langy flashcards for the configured MCP user.',
      inputSchema: z.object({
        limit: z.number().int().min(1).max(500).default(100),
        offset: z.number().int().min(0).default(0),
        search: z.string().trim().optional(),
      }),
    },
    async ({ limit, offset, search }) => {
      const cardService = getConfiguredCardService();
      const cards = await cardService.getAllCards();
      const normalizedSearch = search?.toLowerCase();
      const filteredCards = normalizedSearch
        ? cards.filter((card) =>
            card.front.toLowerCase().includes(normalizedSearch) ||
            card.back.toLowerCase().includes(normalizedSearch)
          )
        : cards;
      const paginatedCards = filteredCards.slice(offset, offset + limit).map(serializeCard);

      return createJsonResponse({
        cards: paginatedCards,
        total: filteredCards.length,
        limit,
        offset,
      });
    }
  );

  server.registerTool(
    'add_flashcard',
    {
      title: 'Add flashcard',
      description: 'Add a Portuguese flashcard to Langy for the configured MCP user.',
      inputSchema: z.object({
        front: z.string().trim().min(1, 'Front text is required'),
        back: z.string().trim().min(1, 'Back text is required'),
      }),
    },
    async ({ front, back }) => {
      const cardService = getConfiguredCardService();
      const card = await cardService.addCard({ front, back });

      return createJsonResponse({
        card: serializeCard(card),
      });
    }
  );

  return server;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: `Method ${req.method} Not Allowed`,
      },
      id: null,
    });
  }

  const server = createServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error('Error handling MCP request:', error);

    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: error instanceof Error ? error.message : 'Internal server error',
        },
        id: null,
      });
    }
  } finally {
    await transport.close();
    await server.close();
  }
}
