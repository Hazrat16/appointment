import jwt, { type SignOptions } from 'jsonwebtoken';
import type { Types } from 'mongoose';

export function generateToken(id: Types.ObjectId | string): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }
  const options = {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  } as SignOptions;
  return jwt.sign({ id: id.toString() }, secret, options);
}
