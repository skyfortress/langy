import { NextApiRequest, NextApiResponse } from 'next';
import { UserService } from '@/services/userService';
import { LoginRequest } from '@/types/user';
import { setAuthCookie } from '@/utils/auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { username, password } = req.body as LoginRequest;
    
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const userService = new UserService();
    const loginResponse = userService.login(username, password);

    if (loginResponse.success) {
      setAuthCookie(res, username);
    }

    return res.status(loginResponse.success ? 200 : 401).json(loginResponse);
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}