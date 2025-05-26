interface TTSResponse {
  audio: string;
  error?: string;
}

export const generatePortugueseAudio = async (text: string): Promise<TTSResponse> => {
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
    console.log(response.status);
    console.log(response.body);
    if (!response.ok) {
      const errorData = await response.json();
      console.log(errorData);
      throw new Error(`ElevenLabs API error: ${errorData.detail || response.statusText}`);
    }

    const audioBuffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString('base64');

    return { audio: base64Audio };
  } catch (error) {
    console.error('Error generating audio:', error);
    return { 
      audio: '', 
      error: error instanceof Error ? error.message : 'Unknown error generating audio' 
    };
  }
}