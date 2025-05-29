import express from 'express'
import { body } from 'express-validator'
import { register, login, forgotPassword, resetPassword } from '../controllers/auth'
import { validate } from '../middleware/validate'

const router = express.Router()

// Validation middleware
const registerValidation = [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('name').notEmpty().withMessage('Name is required'),
  body('role').isIn(['HR', 'ADMIN', 'CANDIDATE']).withMessage('Invalid role'),
]

const loginValidation = [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
]

const forgotPasswordValidation = [
  body('email').isEmail().withMessage('Please enter a valid email'),
]

const resetPasswordValidation = [
  body('token').notEmpty().withMessage('Token is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
]

// Routes
router.post('/register', registerValidation, validate, register)
router.post('/login', loginValidation, validate, login)
router.post('/forgot-password', forgotPasswordValidation, validate, forgotPassword)
router.post('/reset-password', resetPasswordValidation, validate, resetPassword)

export default router 