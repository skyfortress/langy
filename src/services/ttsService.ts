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
import { storeAudioInGridFS } from './gridfsService';

const requestQueue: TTSQueueItem[] = [];
let isProcessing = false;

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

    const audioData = await response.AudioStream.transformToByteArray();
    const audioBuffer = Buffer.from(audioData);
    
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.mp3`;
    const fileId = await storeAudioInGridFS(audioBuffer, fileName, username);
    
    return { audioFileId: fileId };
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