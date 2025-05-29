import { Request, Response, NextFunction } from 'express'
import { prisma } from '../index'
import { AppError } from '../middleware/errorHandler'
import { generateInterviewQuestions } from '../services/ai'

// Get all jobs
export const getJobs = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const jobs = await prisma.jobDescription.findMany({
      include: {
        _count: {
          select: {
            interviews: true,
            candidates: true,
          },
        },
      },
    })

    res.status(200).json({
      status: 'success',
      data: jobs,
    })
  } catch (error) {
    next(error)
  }
}

// Get job by ID
export const getJobById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params
    const job = await prisma.jobDescription.findUnique({
      where: { id: Number(id) },
      include: {
        interviews: true,
        candidates: true,
      },
    })

    if (!job) {
      throw new AppError('Job not found', 404)
    }

    res.status(200).json({
      status: 'success',
      data: job,
    })
  } catch (error) {
    next(error)
  }
}

// Create job
export const createJob = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const job = await prisma.jobDescription.create({
      data: req.body,
    })

    res.status(201).json({
      status: 'success',
      data: job,
    })
  } catch (error) {
    next(error)
  }
}

// Update job
export const updateJob = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params
    const job = await prisma.jobDescription.update({
      where: { id: Number(id) },
      data: req.body,
    })

    res.status(200).json({
      status: 'success',
      data: job,
    })
  } catch (error) {
    next(error)
  }
}

// Delete job
export const deleteJob = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params
    await prisma.jobDescription.delete({
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

// Generate interview questions
export const generateQuestions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params
    const job = await prisma.jobDescription.findUnique({
      where: { id: Number(id) },
    })

    if (!job) {
      throw new AppError('Job not found', 404)
    }

    const questions = await generateInterviewQuestions(job)

    res.status(200).json({
      status: 'success',
      data: questions,
    })
  } catch (error) {
    next(error)
  }
}

// Start interviews for selected candidates
export const startInterviews = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params
    const { candidateIds } = req.body

    const job = await prisma.jobDescription.findUnique({
      where: { id: Number(id) },
    })

    if (!job) {
      throw new AppError('Job not found', 404)
    }

    // Create interviews for each candidate
    const interviews = await Promise.all(
      candidateIds.map((candidateId: number) =>
        prisma.interview.create({
          data: {
            jobId: Number(id),
            candidateId,
            scheduledAt: new Date(),
            duration: 30, // Default duration in minutes
          },
        })
      )
    )

    res.status(201).json({
      status: 'success',
      data: interviews,
    })
  } catch (error) {
    next(error)
  }
}

// Get job statistics
export const getJobStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params
    const stats = await prisma.jobDescription.findUnique({
      where: { id: Number(id) },
      include: {
        _count: {
          select: {
            interviews: true,
            candidates: true,
          },
        },
        interviews: {
          where: {
            status: 'COMPLETED',
          },
          select: {
            score: true,
          },
        },
        candidates: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            interviews: {
              where: {
                jobId: Number(id),
              },
              select: {
                score: true,
              },
            },
          },
        },
      },
    })

    if (!stats) {
      throw new AppError('Job not found', 404)
    }

    // Calculate average score
    const completedInterviews = stats.interviews.filter((i) => i.score !== null)
    const averageScore =
      completedInterviews.length > 0
        ? completedInterviews.reduce((acc, curr) => acc + (curr.score || 0), 0) /
          completedInterviews.length
        : 0

    // Get top candidates
    const topCandidates = stats.candidates
      .map((candidate) => ({
        id: candidate.id,
        name: `${candidate.firstName} ${candidate.lastName}`,
        score:
          candidate.interviews.length > 0
            ? candidate.interviews[0].score || 0
            : 0,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)

    res.status(200).json({
      status: 'success',
      data: {
        totalCandidates: stats._count.candidates,
        completedInterviews: completedInterviews.length,
        averageScore,
        topCandidates,
      },
    })
  } catch (error) {
    next(error)
  }
} 