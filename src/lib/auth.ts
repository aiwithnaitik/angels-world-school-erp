import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { getJwtSecret } from './security';

export interface UserSession {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'TEACHER' | 'ACCOUNTANT' | 'STAFF';
}

export function hashPassword(password: string): string {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
}

export function comparePasswords(password: string, hash: string): boolean {
  try {
    return bcrypt.compareSync(password, hash);
  } catch (e) {
    console.error('Password comparison failed:', e);
    return false;
  }
}

export function signToken(payload: UserSession): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '7d' });
}

export function verifyToken(token: string): UserSession | null {
  try {
    return jwt.verify(token, getJwtSecret()) as UserSession;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}
