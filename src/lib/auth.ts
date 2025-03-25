import jwt from 'jsonwebtoken';
import { User } from '@/types/user';

export const verifyToken = (token: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, process.env.JWT_SECRET!, (err, decoded) => {
      if (err) return reject(err);
      resolve(decoded);
    });
  });
};

interface TokenUser {
  _id: string;
  role: 'user' | 'admin';
}

export const generateToken = (user: TokenUser) => {
  return jwt.sign(
    { 
      userId: user._id,
      role: user.role 
    },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );
};

export const isAuthenticated = async (token?: string) => {
  if (!token) return false;
  try {
    await verifyToken(token);
    return true;
  } catch {
    return false;
  }
};

export const isAdmin = async (token?: string) => {
  if (!token) return false;
  try {
    const decoded = await verifyToken(token);
    return decoded.role === 'admin';
  } catch {
    return false;
  }
};