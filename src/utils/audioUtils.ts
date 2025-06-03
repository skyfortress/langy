import { Card } from '@/types/card';

export function getAudioPath(card: Card): string | null {
  if (card.audioFileId) {
    return `/api/audio/${card.audioFileId}`;
  }
  return null;
}