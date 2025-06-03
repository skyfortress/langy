import { ObjectId } from 'mongodb';

export interface User {
  _id?: ObjectId;
  username: string;
  password: string;
  createdAt: Date;
}

export interface UserSession {
  username: string;
  isLoggedIn: boolean;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  user?: Omit<User, 'password'>;
}