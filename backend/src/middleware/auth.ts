import jwt from 'jsonwebtoken';
import type { NextFunction, Request, Response } from 'express';
import { User } from '../models/User';

interface JwtPayload {
  id: string;
}

export const protect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let token: string | undefined;

    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
      return;
    }

    try {
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        res.status(500).json({ success: false, message: 'Server configuration error.' });
        return;
      }

      const decoded = jwt.verify(token, secret) as JwtPayload;

      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Token is valid but user no longer exists.',
        });
        return;
      }

      if (!user.isActive) {
        res.status(401).json({
          success: false,
          message: 'Account has been deactivated.',
        });
        return;
      }

      req.user = user;
      next();
    } catch {
      res.status(401).json({
        success: false,
        message: 'Invalid token.',
      });
    }
  } catch {
    res.status(500).json({
      success: false,
      message: 'Server error during authentication.',
    });
  }
};

export const authorize =
  (...roles: string[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `User role '${req.user?.role}' is not authorized to access this route.`,
      });
      return;
    }
    next();
  };

export const optionalAuth = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    let token: string | undefined;

    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const secret = process.env.JWT_SECRET;
        if (secret) {
          const decoded = jwt.verify(token, secret) as JwtPayload;
          const user = await User.findById(decoded.id).select('-password');

          if (user?.isActive) {
            req.user = user;
          }
        }
      } catch {
        // invalid token — continue without user
      }
    }

    next();
  } catch {
    next();
  }
};
