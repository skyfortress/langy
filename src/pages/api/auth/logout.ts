import { NextApiRequest, NextApiResponse } from 'next';
import { clearAuthCookie } from '@/utils/auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  clearAuthCookie(res);
  return res.status(200).json({ success: true, message: 'Logged out successfully' });
}