import { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    try {
      const token = await getToken({ req });
      if (token) {
        // Xóa cookie admin
        res.setHeader(
          'Set-Cookie',
          `next-auth-admin.session-token=; Path=/; HttpOnly; SameSite=Lax; Expires=${new Date(
            0
          ).toUTCString()}`
        );
        return res.status(200).json({ success: true });
      }
      return res.status(401).json({ error: 'Unauthorized' });
    } catch (error) {
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
  return res.status(405).json({ error: 'Method Not Allowed' });
}