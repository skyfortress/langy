import fs from 'fs';
import path from 'path';
import { connectToDatabase } from '../src/services/database';
import { storeAudioInGridFS, deleteAudioFromGridFS } from '../src/services/gridfsService';

const AUDIO_DIR = path.join(process.cwd(), 'public', 'audio');

interface MigrationResult {
  totalFiles: number;
  migrated: number;
  errors: string[];
}

async function migrateAudioToGridFS(): Promise<MigrationResult> {
  const result: MigrationResult = {
    totalFiles: 0,
    migrated: 0,
    errors: []
  };

  try {
    await connectToDatabase();
    console.log('Connected to database');

    if (!fs.existsSync(AUDIO_DIR)) {
      console.log('Audio directory does not exist, nothing to migrate');
      return result;
    }

    const files = fs.readdirSync(AUDIO_DIR, { withFileTypes: true });
    const audioFiles = files.filter(file => 
      file.isFile() && file.name.endsWith('.mp3')
    );

    result.totalFiles = audioFiles.length;
    console.log(`Found ${result.totalFiles} audio files to migrate`);

    const userDirectories = files.filter(file => file.isDirectory());
    
    for (const audioFile of audioFiles) {
      try {
        const filePath = path.join(AUDIO_DIR, audioFile.name);
        const audioBuffer = fs.readFileSync(filePath);
        
        const fileId = await storeAudioInGridFS(audioBuffer, audioFile.name);
        console.log(`Migrated ${audioFile.name} -> GridFS ID: ${fileId}`);
        
        result.migrated++;
      } catch (error) {
        const errorMsg = `Failed to migrate ${audioFile.name}: ${error}`;
        result.errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

    for (const userDir of userDirectories) {
      const userDirPath = path.join(AUDIO_DIR, userDir.name);
      const userFiles = fs.readdirSync(userDirPath, { withFileTypes: true });
      const userAudioFiles = userFiles.filter(file => 
        file.isFile() && file.name.endsWith('.mp3')
      );

      for (const audioFile of userAudioFiles) {
        try {
          const filePath = path.join(userDirPath, audioFile.name);
          const audioBuffer = fs.readFileSync(filePath);
          
          const fileId = await storeAudioInGridFS(audioBuffer, audioFile.name, userDir.name);
          console.log(`Migrated ${userDir.name}/${audioFile.name} -> GridFS ID: ${fileId}`);
          
          result.migrated++;
        } catch (error) {
          const errorMsg = `Failed to migrate ${userDir.name}/${audioFile.name}: ${error}`;
          result.errors.push(errorMsg);
          console.error(errorMsg);
        }
      }
    }

    console.log('\nMigration completed!');
    console.log(`Files migrated: ${result.migrated}/${result.totalFiles}`);
    console.log(`Errors: ${result.errors.length}`);
    
    if (result.errors.length > 0) {
      console.log('\nErrors encountered:');
      result.errors.forEach(error => console.log(`- ${error}`));
    }

    return result;
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

async function rollbackMigration(): Promise<void> {
  try {
    await connectToDatabase();
    console.log('Starting rollback...');

    const db = await connectToDatabase();
    const cardsCollection = db.collection('cards');
    
    const cardsWithFileIds = await cardsCollection.find({ 
      audioFileId: { $exists: true } 
    }).toArray();

    console.log(`Found ${cardsWithFileIds.length} cards with GridFS file IDs`);

    for (const card of cardsWithFileIds) {
      try {
        if (card.audioFileId) {
          await deleteAudioFromGridFS(card.audioFileId);
          console.log(`Deleted GridFS file: ${card.audioFileId}`);
        }
        
        await cardsCollection.updateOne(
          { _id: card._id },
          { $unset: { audioFileId: "" } }
        );
        
        console.log(`Removed audioFileId from card ${card.id}`);
      } catch (error) {
        console.error(`Error rolling back card ${card.id}:`, error);
      }
    }

    console.log('Rollback completed');
  } catch (error) {
    console.error('Rollback failed:', error);
    throw error;
  }
}

if (require.main === module) {
  const command = process.argv[2];
  
  if (command === 'migrate') {
    migrateAudioToGridFS()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  } else if (command === 'rollback') {
    rollbackMigration()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  } else {
    console.log('Usage:');
    console.log('  npm run migrate-audio migrate   - Migrate audio files to GridFS');
    console.log('  npm run migrate-audio rollback  - Rollback migration (delete GridFS files)');
    process.exit(1);
  }
}

export { migrateAudioToGridFS, rollbackMigration };