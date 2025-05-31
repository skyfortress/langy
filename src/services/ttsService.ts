import fs from 'fs';
import path from 'path';
import { TTSResponse, TTSQueueItem } from '@/types/tts';
import { 
  PollyClient, 
  SynthesizeSpeechCommand, 
  Engine, 
  OutputFormat, 
  TextType, 
  VoiceId,
  LanguageCode
} from '@aws-sdk/client-polly';

const AUDIO_DIR = path.join(process.cwd(), 'public', 'audio');
const requestQueue: TTSQueueItem[] = [];
let isProcessing = false;

const ensureAudioDir = (username?: string) => {
  const baseDir = username ? path.join(AUDIO_DIR, username) : AUDIO_DIR;
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
  }
};

const processNextRequest = async () => {
  if (isProcessing || requestQueue.length === 0) {
    return;
  }

  isProcessing = true;
  const { text, resolve, reject, username } = requestQueue.shift()!;

  try {
    const result = await processRequest(text, username);
    resolve(result);
  } catch (error) {
    reject(error);
  } finally {
    isProcessing = false;
    processNextRequest();
  }
};

const processRequest = async (text: string, username?: string): Promise<TTSResponse> => {
  try {
    const pollyClient = new PollyClient();

    const params = {
      Engine: 'standard' as Engine,
      LanguageCode: 'pt-PT' as LanguageCode,
      OutputFormat: 'mp3' as OutputFormat,
      Text: text,
      TextType: 'text' as TextType,
      VoiceId: 'Cristiano' as VoiceId
    };

    const command = new SynthesizeSpeechCommand(params);
    const response = await pollyClient.send(command);

    if (!response.AudioStream) {
      throw new Error('No audio stream returned from AWS Polly');
    }

    ensureAudioDir(username);
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.mp3`;
    const userDir = username ? path.join(AUDIO_DIR, username) : AUDIO_DIR;
    const filePath = path.join(userDir, fileName);

    const audioData = await response.AudioStream.transformToByteArray();
    fs.writeFileSync(filePath, Buffer.from(audioData));
    
    const relativePath = username ? `/audio/${username}/${fileName}` : `/audio/${fileName}`;
    return { audioPath: relativePath };
  } catch (error) {
    console.error('Error generating audio:', error);
    return { 
      error: error instanceof Error ? error.message : 'Unknown error generating audio' 
    };
  }
};

export const generatePortugueseAudio = async (text: string, username?: string): Promise<TTSResponse> => {
  return new Promise((resolve, reject) => {
    requestQueue.push({ text, resolve, reject, username });
    
    if (!isProcessing) {
      processNextRequest();
    }
  });
};