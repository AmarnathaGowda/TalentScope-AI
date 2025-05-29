import { AxiosResponse } from 'axios'
import apiClient from '../client'
import { Interview } from '../../store/slices/interviewsSlice'

export const interviewsService = {
  getInterviews: async (): Promise<Interview[]> => {
    const response: AxiosResponse<Interview[]> = await apiClient.get('/interviews')
    return response.data
  },

  getInterviewById: async (id: number): Promise<Interview> => {
    const response: AxiosResponse<Interview> = await apiClient.get(`/interviews/${id}`)
    return response.data
  },

  createInterview: async (interview: Omit<Interview, 'id'>): Promise<Interview> => {
    const response: AxiosResponse<Interview> = await apiClient.post('/interviews', interview)
    return response.data
  },

  updateInterview: async (id: number, interview: Partial<Interview>): Promise<Interview> => {
    const response: AxiosResponse<Interview> = await apiClient.put(`/interviews/${id}`, interview)
    return response.data
  },

  deleteInterview: async (id: number): Promise<void> => {
    await apiClient.delete(`/interviews/${id}`)
  },

  // Interview session management
  startInterviewSession: async (id: number): Promise<{
    sessionId: string
    questions: Array<{
      id: number
      text: string
      type: string
    }>
  }> => {
    const response = await apiClient.post(`/interviews/${id}/start`)
    return response.data
  },

  submitAnswer: async (
    interviewId: number,
    questionId: number,
    answer: {
      videoUrl?: string
      audioUrl?: string
      text?: string
    }
  ): Promise<{
    score: number
    feedback: string
  }> => {
    const response = await apiClient.post(`/interviews/${interviewId}/questions/${questionId}/answer`, answer)
    return response.data
  },

  endInterviewSession: async (id: number): Promise<{
    overallScore: number
    feedback: string
    recommendations: string[]
  }> => {
    const response = await apiClient.post(`/interviews/${id}/end`)
    return response.data
  },

  // Video handling
  getVideoUploadUrl: async (interviewId: number, questionId: number): Promise<{
    uploadUrl: string
    videoKey: string
  }> => {
    const response = await apiClient.get(`/interviews/${interviewId}/questions/${questionId}/upload-url`)
    return response.data
  },

  processVideo: async (interviewId: number, questionId: number, videoKey: string): Promise<{
    status: 'processing' | 'completed' | 'failed'
    transcription?: string
    analysis?: {
      confidence: number
      clarity: number
      technicalAccuracy?: number
    }
  }> => {
    const response = await apiClient.post(`/interviews/${interviewId}/questions/${questionId}/process`, {
      videoKey,
    })
    return response.data
  },

  // Analytics
  getInterviewAnalytics: async (interviewId: number): Promise<{
    duration: number
    questionsAnswered: number
    averageResponseTime: number
    confidenceScore: number
    technicalScore: number
    communicationScore: number
    recommendations: string[]
  }> => {
    const response = await apiClient.get(`/interviews/${interviewId}/analytics`)
    return response.data
  },
} 