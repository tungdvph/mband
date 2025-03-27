import jwt from 'jsonwebtoken';

export const generateToken = (payload: any) => {
  const secret = process.env.JWT_SECRET || 'your-secret-key';
  return jwt.sign(payload, secret, { expiresIn: '1d' });
};

export const verifyToken = (token: string) => {
  const secret = process.env.JWT_SECRET || 'your-secret-key';
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
};