import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'default_access_secret';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'default_refresh_secret';

export interface UserPayload {
  id: string;
  email: string;
  role: 'ADMIN' | 'EMPLOYEE';
}

export class AuthService {
  // Generate JWT access token
  public static generateAccessToken(user: UserPayload): string {
    return jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      ACCESS_SECRET,
      { expiresIn: '15m' }
    );
  }

  // Generate JWT refresh token
  public static generateRefreshToken(user: UserPayload): string {
    return jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      REFRESH_SECRET,
      { expiresIn: '7d' }
    );
  }

  // Store refresh token in database
  public static async storeRefreshToken(userId: string, token: string): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    await prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });
  }

  // Validate refresh token and rotate it
  public static async rotateRefreshToken(oldToken: string): Promise<{ accessToken: string; newRefreshToken: string; user: UserPayload }> {
    try {
      jwt.verify(oldToken, REFRESH_SECRET);
    } catch (err) {
      throw new Error('Invalid refresh token');
    }

    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: oldToken },
      include: { user: true },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      // Clean up if expired token exists
      if (storedToken) {
        await prisma.refreshToken.delete({ where: { id: storedToken.id } });
      }
      throw new Error('Refresh token expired or invalid');
    }

    // Delete old refresh token (used)
    await prisma.refreshToken.delete({
      where: { id: storedToken.id },
    });

    const userPayload: UserPayload = {
      id: storedToken.user.id,
      email: storedToken.user.email,
      role: storedToken.user.role as 'ADMIN' | 'EMPLOYEE',
    };

    // Generate new pair
    const accessToken = this.generateAccessToken(userPayload);
    const newRefreshToken = this.generateRefreshToken(userPayload);

    // Save new refresh token
    await this.storeRefreshToken(userPayload.id, newRefreshToken);

    return {
      accessToken,
      newRefreshToken,
      user: userPayload,
    };
  }

  // Revoke a refresh token on logout
  public static async revokeRefreshToken(token: string): Promise<void> {
    try {
      await prisma.refreshToken.delete({
        where: { token },
      });
    } catch (err) {
      // Token might not exist or already be deleted, ignore
    }
  }

  // Clear all refresh tokens for a user (e.g. security reset)
  public static async revokeAllUserTokens(userId: string): Promise<void> {
    await prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }
}
