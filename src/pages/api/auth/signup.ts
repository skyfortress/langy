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
    const registerResponse = await userService.register(username, password);

    if (registerResponse.success) {
      setAuthCookie(res, username);
    }

    return res.status(registerResponse.success ? 201 : 400).json(registerResponse);
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}