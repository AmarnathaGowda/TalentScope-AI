import express from 'express'
import { body } from 'express-validator'
import { authorize } from '../middleware/auth'
import { validate } from '../middleware/validate'
import {
  getInterviews,
  getInterviewById,
  updateInterview,
  startInterview,
  completeInterview,
  addQuestions,
  submitResponse,
  getInterviewAnalytics,
} from '../controllers/interviews'

const router = express.Router()

// Validation middleware
const questionValidation = [
  body('questions').isArray().withMessage('Questions must be an array'),
  body('questions.*.text').notEmpty().withMessage('Question text is required'),
  body('questions.*.type')
    .isIn(['TECHNICAL', 'BEHAVIORAL', 'EXPERIENCE'])
    .withMessage('Invalid question type'),
]

const responseValidation = [
  body('questionId').isInt().withMessage('Question ID is required'),
  body('response').notEmpty().withMessage('Response is required'),
]

// Routes
router
  .route('/')
  .get(authorize('HR', 'ADMIN'), getInterviews)

router
  .route('/:id')
  .get(authorize('HR', 'ADMIN', 'CANDIDATE'), getInterviewById)
  .put(authorize('HR', 'ADMIN'), updateInterview)

// Interview flow
router.post('/:id/start', authorize('HR', 'ADMIN', 'CANDIDATE'), startInterview)
router.post('/:id/complete', authorize('HR', 'ADMIN'), completeInterview)

// Questions and responses
router.post(
  '/:id/questions',
  authorize('HR', 'ADMIN'),
  questionValidation,
  validate,
  addQuestions
)
router.post(
  '/:id/responses',
  authorize('CANDIDATE'),
  responseValidation,
  validate,
  submitResponse
)

// Analytics
router.get('/:id/analytics', authorize('HR', 'ADMIN'), getInterviewAnalytics)

export default router 