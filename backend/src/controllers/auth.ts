import { Request, Response, NextFunction } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../index'
import { AppError } from '../middleware/errorHandler'
import { sendEmail } from '../utils/email'

// Register new user
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password, name, role } = req.body

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      throw new AppError('User already exists', 400)
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    })

    // Generate token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'default-secret-change-in-production',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    )

    res.status(201).json({
      status: 'success',
      data: {
        user,
        token,
      },
    })
  } catch (error) {
    next(error)
  }
}

// Login user
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      throw new AppError('Invalid credentials', 401)
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401)
    }

    // Generate token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'default-secret-change-in-production',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    )

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user

    res.status(200).json({
      status: 'success',
      data: {
        user: userWithoutPassword,
        token,
      },
    })
  } catch (error) {
    next(error)
  }
}

// Forgot password
export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.body

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      throw new AppError('User not found', 404)
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'default-secret-change-in-production',
      { expiresIn: '1h' }
    )

    // Send reset email
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`
    await sendEmail({
      to: user.email,
      subject: 'Password Reset Request',
      text: `To reset your password, click the following link: ${resetUrl}`,
      html: `
        <p>To reset your password, click the following link:</p>
        <a href="${resetUrl}">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
      `,
    })

    res.status(200).json({
      status: 'success',
      message: 'Password reset link sent to email',
    })
  } catch (error) {
    next(error)
  }
}

// Reset password
export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { token, password } = req.body

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'default-secret-change-in-production'
    ) as { userId: number }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Update user password
    await prisma.user.update({
      where: { id: decoded.userId },
      data: { password: hashedPassword },
    })

    res.status(200).json({
      status: 'success',
      message: 'Password successfully reset',
    })
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Invalid or expired token', 400))
    } else {
      next(error)
    }
  }
} 