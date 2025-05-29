import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { Server } from 'socket.io'
import dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client'

// Load environment variables
dotenv.config()

// Import routes
import authRoutes from './routes/auth'
import jobRoutes from './routes/jobs'
import candidateRoutes from './routes/candidates'
import interviewRoutes from './routes/interviews'

// Import middleware
import { errorHandler } from './middleware/errorHandler'
import { authenticate } from './middleware/auth'

// Initialize Express app
const app = express()
const httpServer = createServer(app)
export const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
})

// Initialize Prisma
export const prisma = new PrismaClient()

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/jobs', authenticate, jobRoutes)
app.use('/api/candidates', authenticate, candidateRoutes)
app.use('/api/interviews', authenticate, interviewRoutes)

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id)

  socket.on('join-interview', (interviewId: string) => {
    socket.join(`interview-${interviewId}`)
  })

  socket.on('interview-status-update', (data: { interviewId: string; status: string }) => {
    io.to(`interview-${data.interviewId}`).emit('interview-status-changed', data)
  })

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id)
  })
})

// Error handling
app.use(errorHandler)

// Start server
const PORT = process.env.PORT || 4000
httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
}) 