import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config/index.js';
import type { IUserDocument } from '../models/index.js';

export interface JWTPayload {
  userId: string;
  companyId: string;
  isAdmin: boolean;
  iat?: number;
  exp?: number;
}

/**
 * Generate JWT access token
 */
export function generateAccessToken(user: IUserDocument): string {
  const payload: JWTPayload = {
    userId: user._id.toString(),
    companyId: user.companyID.toString(),
    isAdmin: user.isAdmin,
  };

  const options: SignOptions = {
    expiresIn: config.jwtExpiresIn as jwt.SignOptions['expiresIn'],
  };

  return jwt.sign(payload, config.jwtSecret, options);
}

/**
 * Generate JWT refresh token
 */
export function generateRefreshToken(user: IUserDocument): string {
  const payload: JWTPayload = {
    userId: user._id.toString(),
    companyId: user.companyID.toString(),
    isAdmin: user.isAdmin,
  };

  const options: SignOptions = {
    expiresIn: config.jwtRefreshExpiresIn as jwt.SignOptions['expiresIn'],
  };

  return jwt.sign(payload, config.jwtSecret, options);
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, config.jwtSecret) as JWTPayload;
}

/**
 * Generate both access and refresh tokens
 */
export function generateTokens(user: IUserDocument): { accessToken: string; refreshToken: string } {
  return {
    accessToken: generateAccessToken(user),
    refreshToken: generateRefreshToken(user),
  };
}
