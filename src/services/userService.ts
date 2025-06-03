import * as crypto from 'crypto';
import { User, LoginResponse } from '../types/user';
import { connectToDatabase } from './database';

const USERS_COLLECTION = 'users';

export class UserService {
  private async getUsersCollection() {
    const db = await connectToDatabase();
    return db.collection<User>(USERS_COLLECTION);
  }

  private hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
  }

  private verifyPassword(password: string, hashedPassword: string): boolean {
    const [salt, hash] = hashedPassword.split(':');
    const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return hash === verifyHash;
  }

  async getUserByUsername(username: string): Promise<User | null> {
    const collection = await this.getUsersCollection();
    return await collection.findOne({ username });
  }

  async register(username: string, password: string): Promise<LoginResponse> {
    const collection = await this.getUsersCollection();
    
    const existingUser = await collection.findOne({ username });
    if (existingUser) {
      return { success: false, message: 'Username already exists' };
    }

    const hashedPassword = this.hashPassword(password);
    const newUser: User = {
      username,
      password: hashedPassword,
      createdAt: new Date()
    };

    await collection.insertOne(newUser);

    return { 
      success: true, 
      message: 'User registered successfully',
      user: {
        username: newUser.username,
        createdAt: newUser.createdAt
      }
    };
  }

  async login(username: string, password: string): Promise<LoginResponse> {
    const user = await this.getUserByUsername(username);
    
    if (!user) {
      return { success: false, message: 'Invalid username or password' };
    }

    if (!this.verifyPassword(password, user.password)) {
      return { success: false, message: 'Invalid username or password' };
    }

    return { 
      success: true, 
      message: 'Login successful',
      user: {
        username: user.username,
        createdAt: user.createdAt
      }
    };
  }
}