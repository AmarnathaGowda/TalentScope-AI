import { Request, Response, NextFunction } from 'express'
import { validationResult } from 'express-validator'
import { AppError } from './errorHandler'

export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((error) => ({
      field: error.param,
      message: error.msg,
    }))

    throw new AppError(JSON.stringify(errorMessages), 400)
  }
  next()
} 