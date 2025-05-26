import fs from 'fs';
import path from 'path';
import { TTSResponse, TTSQueueItem } from '@/types/tts';

const AUDIO_DIR = path.join(process.cwd(), 'public', 'audio');
const requestQueue: TTSQueueItem[] = [];
let isProcessing = false;

const ensureAudioDir = () => {
  if (!fs.existsSync(AUDIO_DIR)) {
    fs.mkdirSync(AUDIO_DIR, { recursive: true });
  }
};

const processNextRequest = async () => {
  if (isProcessing || requestQueue.length === 0) {
    return;
  }

  isProcessing = true;
  const { text, resolve, reject } = requestQueue.shift()!;

  try {
    const result = await processRequest(text);
    resolve(result);
  } catch (error) {
    reject(error);
  } finally {
    isProcessing = false;
    processNextRequest();
  }
};

const processRequest = async (text: string): Promise<TTSResponse> => {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    
    if (!apiKey) {
      throw new Error('ELEVENLABS_API_KEY is not set in environment variables');
    }

    const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/iP95p4xoKVk53GoZ742B?output_format=mp3_44100_128', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_multilingual_v2'
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`ElevenLabs API error: ${errorData.detail || response.statusText}`);
    }

    ensureAudioDir();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.mp3`;
    const filePath = path.join(AUDIO_DIR, fileName);
    const audioBuffer = await response.arrayBuffer();
    
    fs.writeFileSync(filePath, Buffer.from(audioBuffer));
    
    const relativePath = `/audio/${fileName}`;
    return { audioPath: relativePath };
  } catch (error) {
    console.error('Error generating audio:', error);
    return { 
      error: error instanceof Error ? error.message : 'Unknown error generating audio' 
    };
  }
};

export const generatePortugueseAudio = async (text: string): Promise<TTSResponse> => {
  return new Promise((resolve, reject) => {
    requestQueue.push({ text, resolve, reject });
    
    if (!isProcessing) {
      processNextRequest();
    }
  });
};