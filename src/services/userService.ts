import fs from 'fs';
import path from 'path';
import { User, LoginResponse } from '../types/user';
import * as crypto from 'crypto';

export class UserService {
  private usersFilePath: string;
  private dataDir: string;

  constructor() {
    this.dataDir = path.join(process.cwd(), 'data');
    this.usersFilePath = path.join(this.dataDir, 'users.json');
    this.ensureDataDir();
  }

  private ensureDataDir(): void {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }

    if (!fs.existsSync(this.usersFilePath)) {
      fs.writeFileSync(this.usersFilePath, JSON.stringify({ users: [] }, null, 2));
    }
  }

  private ensureUserDir(username: string): void {
    const userDir = path.join(this.dataDir, username);
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }
    
    const sessionDir = path.join(userDir, 'chat-sessions');
    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    }

    const cardsFilePath = path.join(userDir, 'cards.json');
    if (!fs.existsSync(cardsFilePath)) {
      fs.writeFileSync(cardsFilePath, JSON.stringify({ cards: [] }, null, 2));
    }
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

  private getAllUsers(): User[] {
    this.ensureDataDir();
    try {
      const data = fs.readFileSync(this.usersFilePath, 'utf-8');
      return JSON.parse(data).users;
    } catch (error) {
      return [];
    }
  }

  getUserByUsername(username: string): User | null {
    const users = this.getAllUsers();
    return users.find(u => u.username === username) || null;
  }

  register(username: string, password: string): LoginResponse {
    const users = this.getAllUsers();
    
    if (users.some(u => u.username === username)) {
      return { success: false, message: 'Username already exists' };
    }

    const hashedPassword = this.hashPassword(password);
    const newUser: User = {
      username,
      password: hashedPassword,
      createdAt: new Date()
    };

    users.push(newUser);
    fs.writeFileSync(this.usersFilePath, JSON.stringify({ users }, null, 2));
    
    this.ensureUserDir(username);

    return { 
      success: true, 
      message: 'User registered successfully',
      user: {
        username: newUser.username,
        createdAt: newUser.createdAt
      }
    };
  }

  login(username: string, password: string): LoginResponse {
    const user = this.getUserByUsername(username);
    
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