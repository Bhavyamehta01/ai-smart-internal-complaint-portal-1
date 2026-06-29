import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma';
import { AuthService, UserPayload } from '../services/authService';
import { loginSchema } from '../validation/authValidation';
import { CustomError } from '../utils/customError';
import { asyncHandler } from '../utils/asyncHandler';

// Cookie option settings
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
};

export const login = asyncHandler(async (req: Request, res: Response) => {
  // Validate request body
  const parseResult = loginSchema.safeParse(req.body);
  if (!parseResult.success) {
    throw new CustomError(parseResult.error.errors[0].message, 400);
  }

  const { email, password } = parseResult.data;

  // Fetch user from DB
  const user = await prisma.user.findUnique({
    where: { email },
    include: { department: true },
  });

  if (!user) {
    throw new CustomError('Invalid email or password', 401);
  }

  // Compare passwords
  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new CustomError('Invalid email or password', 401);
  }

  const payload: UserPayload = {
    id: user.id,
    email: user.email,
    role: user.role as 'ADMIN' | 'EMPLOYEE',
  };

  // Generate tokens
  const accessToken = AuthService.generateAccessToken(payload);
  const refreshToken = AuthService.generateRefreshToken(payload);

  // Store refresh token
  await AuthService.storeRefreshToken(user.id, refreshToken);

  // Write token cookie
  res.cookie('refreshToken', refreshToken, cookieOptions);

  // Send response
  res.status(200).json({
    status: 'success',
    data: {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        employeeId: user.employeeId,
        role: user.role,
        department: user.department.name,
      },
    },
  });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if (refreshToken) {
    // Revoke token in DB
    await AuthService.revokeRefreshToken(refreshToken);
  }

  // Clear cookie
  res.clearCookie('refreshToken', {
    ...cookieOptions,
    maxAge: 0,
  });

  res.status(200).json({
    status: 'success',
    message: 'Successfully logged out',
  });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const oldRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if (!oldRefreshToken) {
    throw new CustomError('Session expired. Please log in again.', 401);
  }

  try {
    const { accessToken, newRefreshToken, user } = await AuthService.rotateRefreshToken(oldRefreshToken);

    // Update refresh token cookie
    res.cookie('refreshToken', newRefreshToken, cookieOptions);

    res.status(200).json({
      status: 'success',
      data: {
        accessToken,
        user,
      },
    });
  } catch (err: any) {
    // Clear cookie on failure
    res.clearCookie('refreshToken', {
      ...cookieOptions,
      maxAge: 0,
    });
    throw new CustomError(err.message || 'Invalid refresh token session', 401);
  }
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new CustomError('Not authenticated', 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: { department: true },
  });

  if (!user) {
    throw new CustomError('User profile not found', 404);
  }

  res.status(200).json({
    status: 'success',
    data: {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        employeeId: user.employeeId,
        role: user.role,
        department: user.department.name,
      },
    },
  });
});
