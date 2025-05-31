import { NextApiRequest, NextApiResponse } from 'next';
import { getUserFromRequest } from '@/utils/auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const user = getUserFromRequest(req);
    
    if (!user || !user.isLoggedIn) {
      return res.status(401).json({ isLoggedIn: false });
    }

    return res.status(200).json({
      isLoggedIn: true,
      username: user.username
    });
  } catch (error) {
    console.error('Error checking auth status:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}