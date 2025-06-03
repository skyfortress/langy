import { NextApiRequest, NextApiResponse } from 'next';
import { getAudioFromGridFS, getAudioMetadata } from '@/services/gridfsService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { fileId } = req.query;

  if (!fileId || typeof fileId !== 'string') {
    return res.status(400).json({ error: 'File ID is required' });
  }

  try {
    const metadata = await getAudioMetadata(fileId);
    const audioBuffer = await getAudioFromGridFS(fileId);

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', audioBuffer.length);
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.setHeader('Content-Disposition', `inline; filename="${metadata.filename}"`);
    
    return res.send(audioBuffer);
  } catch (error) {
    console.error('Error serving audio file:', error);
    return res.status(404).json({ error: 'Audio file not found' });
  }
}