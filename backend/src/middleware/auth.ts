import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { prisma } from '../index'
import { AppError } from './errorHandler'

interface JwtPayload {
  userId: number
  role: string
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number
        role: string
      }
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401)
    }

    const token = authHeader.split(' ')[1]

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'default-secret-change-in-production'
    ) as JwtPayload

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true },
    })

    if (!user) {
      throw new AppError('User not found', 401)
    }

    // Add user to request object
    req.user = user
    next()
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Invalid token', 401))
    } else {
      next(error)
    }
  }
}

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Not authenticated', 401))
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('Not authorized', 403))
    }

    next()
  }
} 