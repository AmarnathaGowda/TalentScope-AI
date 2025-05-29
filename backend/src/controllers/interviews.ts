import { Request, Response, NextFunction } from 'express'
import { prisma } from '../index'
import { AppError } from '../middleware/errorHandler'
import { analyzeInterviewResponse } from '../services/ai'
import { io } from '../index'

// Get all interviews
export const getInterviews = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const interviews = await prisma.interview.findMany({
      include: {
        job: true,
        candidate: true,
        questions: true,
      },
    })

    res.status(200).json({
      status: 'success',
      data: interviews,
    })
  } catch (error) {
    next(error)
  }
}

// Get interview by ID
export const getInterviewById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params
    const interview = await prisma.interview.findUnique({
      where: { id: Number(id) },
      include: {
        job: true,
        candidate: true,
        questions: true,
      },
    })

    if (!interview) {
      throw new AppError('Interview not found', 404)
    }

    // Check authorization
    if (
      req.user?.role === 'CANDIDATE' &&
      req.user.id !== interview.candidate.id
    ) {
      throw new AppError('Not authorized', 403)
    }

    res.status(200).json({
      status: 'success',
      data: interview,
    })
  } catch (error) {
    next(error)
  }
}

// Update interview
export const updateInterview = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params
    const interview = await prisma.interview.update({
      where: { id: Number(id) },
      data: req.body,
      include: {
        job: true,
        candidate: true,
      },
    })

    // Notify connected clients about the update
    io.to(`interview-${id}`).emit('interview-status-changed', {
      interviewId: id,
      status: interview.status,
    })

    res.status(200).json({
      status: 'success',
      data: interview,
    })
  } catch (error) {
    next(error)
  }
}

// Start interview
export const startInterview = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params
    const interview = await prisma.interview.update({
      where: { id: Number(id) },
      data: {
        status: 'IN_PROGRESS',
        startedAt: new Date(),
      },
      include: {
        job: true,
        candidate: true,
        questions: true,
      },
    })

    // Notify connected clients
    io.to(`interview-${id}`).emit('interview-started', {
      interviewId: id,
      questions: interview.questions,
    })

    res.status(200).json({
      status: 'success',
      data: interview,
    })
  } catch (error) {
    next(error)
  }
}

// Complete interview
export const completeInterview = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params
    const interview = await prisma.interview.update({
      where: { id: Number(id) },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
      include: {
        job: true,
        candidate: true,
        questions: true,
      },
    })

    // Calculate overall score
    const scores = interview.questions
      .map((q) => q.score || 0)
      .filter((score) => score > 0)
    const averageScore =
      scores.length > 0
        ? scores.reduce((a, b) => a + b, 0) / scores.length
        : 0

    // Update interview with final score
    const updatedInterview = await prisma.interview.update({
      where: { id: Number(id) },
      data: {
        score: averageScore,
      },
    })

    // Notify connected clients
    io.to(`interview-${id}`).emit('interview-completed', {
      interviewId: id,
      score: averageScore,
    })

    res.status(200).json({
      status: 'success',
      data: updatedInterview,
    })
  } catch (error) {
    next(error)
  }
}

// Add questions to interview
export const addQuestions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params
    const { questions } = req.body

    const createdQuestions = await prisma.$transaction(
      questions.map((question: { text: string; type: string }) =>
        prisma.question.create({
          data: {
            interviewId: Number(id),
            text: question.text,
            type: question.type,
          },
        })
      )
    )

    res.status(201).json({
      status: 'success',
      data: createdQuestions,
    })
  } catch (error) {
    next(error)
  }
}

// Submit response to question
export const submitResponse = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { questionId, response } = req.body

    // Get question and interview details
    const question = await prisma.question.findUnique({
      where: { id: Number(questionId) },
      include: {
        interview: {
          include: {
            job: true,
          },
        },
      },
    })

    if (!question) {
      throw new AppError('Question not found', 404)
    }

    // Check authorization
    if (req.user?.role === 'CANDIDATE') {
      const interview = await prisma.interview.findUnique({
        where: { id: question.interviewId },
        include: {
          candidate: true,
        },
      })

      if (interview?.candidate.id !== req.user.id) {
        throw new AppError('Not authorized', 403)
      }
    }

    // Analyze response using AI
    const analysis = await analyzeInterviewResponse(
      question.text,
      response,
      question.interview.job.requirements
    )

    // Update question with response and score
    const updatedQuestion = await prisma.question.update({
      where: { id: Number(questionId) },
      data: {
        response,
        score: analysis.score,
      },
    })

    // Notify connected clients
    io.to(`interview-${question.interviewId}`).emit('response-submitted', {
      questionId,
      score: analysis.score,
      feedback: analysis.feedback,
    })

    res.status(200).json({
      status: 'success',
      data: {
        question: updatedQuestion,
        analysis,
      },
    })
  } catch (error) {
    next(error)
  }
}

// Get interview analytics
export const getInterviewAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params
    const interview = await prisma.interview.findUnique({
      where: { id: Number(id) },
      include: {
        questions: {
          select: {
            type: true,
            score: true,
            response: true,
          },
        },
      },
    })

    if (!interview) {
      throw new AppError('Interview not found', 404)
    }

    // Calculate scores by question type
    const scoresByType = interview.questions.reduce((acc, question) => {
      if (question.score !== null) {
        if (!acc[question.type]) {
          acc[question.type] = {
            total: 0,
            count: 0,
          }
        }
        acc[question.type].total += question.score
        acc[question.type].count += 1
      }
      return acc
    }, {} as Record<string, { total: number; count: number }>)

    // Calculate average scores by type
    const averageScores = Object.entries(scoresByType).reduce(
      (acc, [type, data]) => {
        acc[type] = data.total / data.count
        return acc
      },
      {} as Record<string, number>
    )

    // Calculate response rates
    const totalQuestions = interview.questions.length
    const answeredQuestions = interview.questions.filter(
      (q) => q.response !== null
    ).length
    const responseRate = (answeredQuestions / totalQuestions) * 100

    res.status(200).json({
      status: 'success',
      data: {
        totalQuestions,
        answeredQuestions,
        responseRate,
        averageScores,
        overallScore: interview.score,
      },
    })
  } catch (error) {
    next(error)
  }
} 