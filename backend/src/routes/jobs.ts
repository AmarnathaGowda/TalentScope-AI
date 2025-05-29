import express from 'express'
import { body } from 'express-validator'
import { authorize } from '../middleware/auth'
import { validate } from '../middleware/validate'
import {
  createJob,
  getJobs,
  getJobById,
  updateJob,
  deleteJob,
  generateQuestions,
  startInterviews,
  getJobStats,
} from '../controllers/jobs'

const router = express.Router()

// Validation middleware
const jobValidation = [
  body('title').notEmpty().withMessage('Title is required'),
  body('department').notEmpty().withMessage('Department is required'),
  body('location').notEmpty().withMessage('Location is required'),
  body('experience').notEmpty().withMessage('Experience is required'),
  body('skills').isArray().withMessage('Skills must be an array'),
  body('description').notEmpty().withMessage('Description is required'),
  body('requirements').notEmpty().withMessage('Requirements are required'),
]

// Routes
router
  .route('/')
  .get(getJobs)
  .post(authorize('HR', 'ADMIN'), jobValidation, validate, createJob)

router
  .route('/:id')
  .get(getJobById)
  .put(authorize('HR', 'ADMIN'), jobValidation, validate, updateJob)
  .delete(authorize('HR', 'ADMIN'), deleteJob)

router.post('/:id/generate-questions', authorize('HR', 'ADMIN'), generateQuestions)
router.post('/:id/start-interviews', authorize('HR', 'ADMIN'), startInterviews)
router.get('/:id/stats', authorize('HR', 'ADMIN'), getJobStats)

export default router 