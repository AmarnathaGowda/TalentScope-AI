import express from 'express'
import { body } from 'express-validator'
import { authorize } from '../middleware/auth'
import { validate } from '../middleware/validate'
import {
  getCandidates,
  getCandidateById,
  createCandidate,
  updateCandidate,
  deleteCandidate,
  uploadResume,
  parseResume,
  scheduleInterview,
  matchToJobs,
  getCandidateAnalytics,
} from '../controllers/candidates'
import multer from 'multer'

const router = express.Router()

// Configure multer for resume upload
const storage = multer.memoryStorage()
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.mimetype === 'application/msword' || file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      cb(null, true)
    } else {
      cb(null, false)
      return cb(new Error('Only PDF and Word documents are allowed'))
    }
  },
})

// Validation middleware
const candidateValidation = [
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('phone').optional().isMobilePhone('any').withMessage('Please enter a valid phone number'),
  body('experience').isInt({ min: 0 }).withMessage('Experience must be a positive number'),
  body('skills').isArray().withMessage('Skills must be an array'),
  body('location').notEmpty().withMessage('Location is required'),
]

// Routes
router
  .route('/')
  .get(authorize('HR', 'ADMIN'), getCandidates)
  .post(candidateValidation, validate, createCandidate)

router
  .route('/:id')
  .get(authorize('HR', 'ADMIN', 'CANDIDATE'), getCandidateById)
  .put(authorize('HR', 'ADMIN', 'CANDIDATE'), candidateValidation, validate, updateCandidate)
  .delete(authorize('HR', 'ADMIN'), deleteCandidate)

// Resume handling
router.post(
  '/:id/resume',
  authorize('HR', 'ADMIN', 'CANDIDATE'),
  upload.single('resume'),
  uploadResume
)
router.post('/:id/parse-resume', authorize('HR', 'ADMIN'), parseResume)

// Interview scheduling
router.post(
  '/:id/schedule-interview',
  authorize('HR', 'ADMIN'),
  [
    body('jobId').isInt().withMessage('Job ID is required'),
    body('scheduledAt').isISO8601().withMessage('Valid date is required'),
  ],
  validate,
  scheduleInterview
)

// Job matching and analytics
router.get('/:id/job-matches', authorize('HR', 'ADMIN'), matchToJobs)
router.get('/:id/analytics', authorize('HR', 'ADMIN'), getCandidateAnalytics)

export default router 