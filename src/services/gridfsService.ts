import { GridFSBucket, ObjectId } from 'mongodb';
import { connectToDatabase } from './database';

let audioFilesBucket: GridFSBucket | null = null;

const getAudioFilesBucket = async (): Promise<GridFSBucket> => {
  if (!audioFilesBucket) {
    const db = await connectToDatabase();
    audioFilesBucket = new GridFSBucket(db, { bucketName: 'audioFiles' });
  }
  return audioFilesBucket;
};

export const storeAudioInGridFS = async (
  audioBuffer: Buffer,
  filename: string,
  username?: string
): Promise<string> => {
  const bucket = await getAudioFilesBucket();
  
  const metadata = {
    username: username || 'anonymous',
    uploadDate: new Date(),
    contentType: 'audio/mpeg'
  };

  return new Promise((resolve, reject) => {
    const uploadStream = bucket.openUploadStream(filename, { metadata });
    
    uploadStream.on('error', (error) => {
      reject(error);
    });
    
    uploadStream.on('finish', () => {
      resolve(uploadStream.id.toString());
    });
    
    uploadStream.end(audioBuffer);
  });
};

export const getAudioFromGridFS = async (fileId: string): Promise<Buffer> => {
  const bucket = await getAudioFilesBucket();
  
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const downloadStream = bucket.openDownloadStream(new ObjectId(fileId));
    
    downloadStream.on('data', (chunk) => {
      chunks.push(chunk);
    });
    
    downloadStream.on('error', (error) => {
      reject(error);
    });
    
    downloadStream.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
  });
};

export const deleteAudioFromGridFS = async (fileId: string): Promise<void> => {
  const bucket = await getAudioFilesBucket();
  await bucket.delete(new ObjectId(fileId));
};

export const getAudioMetadata = async (fileId: string) => {
  const bucket = await getAudioFilesBucket();
  const files = await bucket.find({ _id: new ObjectId(fileId) }).toArray();
  
  if (files.length === 0) {
    throw new Error('Audio file not found');
  }
  
  return files[0];
};