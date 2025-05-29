import { Request, Response, NextFunction } from 'express'
import { prisma } from '../index'
import { AppError } from '../middleware/errorHandler'
import { uploadToS3, parseResumeWithAI } from '../services/aws'
import { analyzeSkillMatch } from '../services/ai'

// Get all candidates
export const getCandidates = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const candidates = await prisma.candidate.findMany({
      include: {
        _count: {
          select: {
            interviews: true,
            appliedJobs: true,
          },
        },
      },
    })

    res.status(200).json({
      status: 'success',
      data: candidates,
    })
  } catch (error) {
    next(error)
  }
}

// Get candidate by ID
export const getCandidateById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params
    const candidate = await prisma.candidate.findUnique({
      where: { id: Number(id) },
      include: {
        interviews: {
          include: {
            job: true,
            questions: true,
          },
        },
        appliedJobs: true,
      },
    })

    if (!candidate) {
      throw new AppError('Candidate not found', 404)
    }

    // Check authorization
    if (req.user?.role === 'CANDIDATE' && req.user.id !== Number(id)) {
      throw new AppError('Not authorized', 403)
    }

    res.status(200).json({
      status: 'success',
      data: candidate,
    })
  } catch (error) {
    next(error)
  }
}

// Create candidate
export const createCandidate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const candidate = await prisma.candidate.create({
      data: req.body,
    })

    res.status(201).json({
      status: 'success',
      data: candidate,
    })
  } catch (error) {
    next(error)
  }
}

// Update candidate
export const updateCandidate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params

    // Check authorization
    if (req.user?.role === 'CANDIDATE' && req.user.id !== Number(id)) {
      throw new AppError('Not authorized', 403)
    }

    const candidate = await prisma.candidate.update({
      where: { id: Number(id) },
      data: req.body,
    })

    res.status(200).json({
      status: 'success',
      data: candidate,
    })
  } catch (error) {
    next(error)
  }
}

// Delete candidate
export const deleteCandidate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params
    await prisma.candidate.delete({
      where: { id: Number(id) },
    })

    res.status(204).json({
      status: 'success',
      data: null,
    })
  } catch (error) {
    next(error)
  }
}

// Upload resume
export const uploadResume = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params
    const file = req.file

    if (!file) {
      throw new AppError('No file uploaded', 400)
    }

    // Check authorization
    if (req.user?.role === 'CANDIDATE' && req.user.id !== Number(id)) {
      throw new AppError('Not authorized', 403)
    }

    // Upload to S3
    const resumeUrl = await uploadToS3(file)

    // Update candidate
    const candidate = await prisma.candidate.update({
      where: { id: Number(id) },
      data: { resumeUrl },
    })

    res.status(200).json({
      status: 'success',
      data: {
        resumeUrl: candidate.resumeUrl,
      },
    })
  } catch (error) {
    next(error)
  }
}

// Parse resume
export const parseResume = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params
    const candidate = await prisma.candidate.findUnique({
      where: { id: Number(id) },
      select: { resumeUrl: true },
    })

    if (!candidate?.resumeUrl) {
      throw new AppError('No resume found', 404)
    }

    const parsedData = await parseResumeWithAI(candidate.resumeUrl)

    res.status(200).json({
      status: 'success',
      data: parsedData,
    })
  } catch (error) {
    next(error)
  }
}

// Schedule interview
export const scheduleInterview = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params
    const { jobId, scheduledAt } = req.body

    const interview = await prisma.interview.create({
      data: {
        candidateId: Number(id),
        jobId: Number(jobId),
        scheduledAt: new Date(scheduledAt),
        duration: 30, // Default duration in minutes
      },
      include: {
        job: true,
        candidate: true,
      },
    })

    res.status(201).json({
      status: 'success',
      data: interview,
    })
  } catch (error) {
    next(error)
  }
}

// Match to jobs
export const matchToJobs = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params
    const candidate = await prisma.candidate.findUnique({
      where: { id: Number(id) },
      select: { skills: true },
    })

    if (!candidate) {
      throw new AppError('Candidate not found', 404)
    }

    const jobs = await prisma.jobDescription.findMany({
      where: {
        status: 'ACTIVE',
      },
    })

    const matches = await Promise.all(
      jobs.map(async (job) => {
        const matchScore = await analyzeSkillMatch(candidate.skills, job.skills)
        return {
          jobId: job.id,
          title: job.title,
          matchScore,
          matchedSkills: candidate.skills.filter((skill) =>
            job.skills.includes(skill)
          ),
          missingSkills: job.skills.filter(
            (skill) => !candidate.skills.includes(skill)
          ),
        }
      })
    )

    // Sort by match score
    matches.sort((a, b) => b.matchScore - a.matchScore)

    res.status(200).json({
      status: 'success',
      data: matches,
    })
  } catch (error) {
    next(error)
  }
}

// Get candidate analytics
export const getCandidateAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params
    const analytics = await prisma.candidate.findUnique({
      where: { id: Number(id) },
      include: {
        interviews: {
          select: {
            score: true,
            questions: {
              select: {
                type: true,
                score: true,
              },
            },
          },
        },
      },
    })

    if (!analytics) {
      throw new AppError('Candidate not found', 404)
    }

    // Calculate statistics
    const totalInterviews = analytics.interviews.length
    const completedInterviews = analytics.interviews.filter(
      (i) => i.score !== null
    )
    const averageScore =
      completedInterviews.length > 0
        ? completedInterviews.reduce((acc, curr) => acc + (curr.score || 0), 0) /
          completedInterviews.length
        : 0

    // Calculate scores by question type
    const scoresByType = analytics.interviews.reduce((acc, interview) => {
      interview.questions.forEach((q) => {
        if (q.score !== null) {
          if (!acc[q.type]) {
            acc[q.type] = {
              total: 0,
              count: 0,
            }
          }
          acc[q.type].total += q.score
          acc[q.type].count += 1
        }
      })
      return acc
    }, {} as Record<string, { total: number; count: number }>)

    const skillsAssessment = Object.entries(scoresByType).reduce(
      (acc, [type, data]) => {
        acc[type] = data.total / data.count
        return acc
      },
      {} as Record<string, number>
    )

    res.status(200).json({
      status: 'success',
      data: {
        totalInterviews,
        completedInterviews: completedInterviews.length,
        averageScore,
        skillsAssessment,
      },
    })
  } catch (error) {
    next(error)
  }
} 