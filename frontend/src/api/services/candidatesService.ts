import { AxiosResponse } from 'axios'
import apiClient from '../client'
import { Candidate } from '../../store/slices/candidatesSlice'

export const candidatesService = {
  getCandidates: async (): Promise<Candidate[]> => {
    const response: AxiosResponse<Candidate[]> = await apiClient.get('/candidates')
    return response.data
  },

  getCandidateById: async (id: number): Promise<Candidate> => {
    const response: AxiosResponse<Candidate> = await apiClient.get(`/candidates/${id}`)
    return response.data
  },

  createCandidate: async (candidate: Omit<Candidate, 'id'>): Promise<Candidate> => {
    const response: AxiosResponse<Candidate> = await apiClient.post('/candidates', candidate)
    return response.data
  },

  updateCandidate: async (id: number, candidate: Partial<Candidate>): Promise<Candidate> => {
    const response: AxiosResponse<Candidate> = await apiClient.put(`/candidates/${id}`, candidate)
    return response.data
  },

  deleteCandidate: async (id: number): Promise<void> => {
    await apiClient.delete(`/candidates/${id}`)
  },

  // Resume handling
  uploadResume: async (id: number, file: File): Promise<{ resumeUrl: string }> => {
    const formData = new FormData()
    formData.append('resume', file)
    const response = await apiClient.post(`/candidates/${id}/resume`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  parseResume: async (id: number): Promise<{
    skills: string[]
    experience: number
    education: Array<{
      degree: string
      institution: string
      year: number
    }>
    workHistory: Array<{
      company: string
      role: string
      duration: string
      responsibilities: string[]
    }>
  }> => {
    const response = await apiClient.post(`/candidates/${id}/parse-resume`)
    return response.data
  },

  // Interview scheduling
  scheduleInterview: async (
    candidateId: number,
    jobId: number,
    scheduledAt: string
  ): Promise<{
    interviewId: number
    scheduledAt: string
    meetingLink?: string
  }> => {
    const response = await apiClient.post(`/candidates/${candidateId}/schedule-interview`, {
      jobId,
      scheduledAt,
    })
    return response.data
  },

  // Candidate matching
  matchToJobs: async (candidateId: number): Promise<
    Array<{
      jobId: number
      title: string
      matchScore: number
      matchedSkills: string[]
      missingSkills: string[]
    }>
  > => {
    const response = await apiClient.get(`/candidates/${candidateId}/job-matches`)
    return response.data
  },

  // Analytics
  getCandidateAnalytics: async (id: number): Promise<{
    totalInterviews: number
    averageScore: number
    skillsAssessment: {
      [key: string]: number // skill: score
    }
    strengths: string[]
    areasOfImprovement: string[]
    recommendedRoles: string[]
  }> => {
    const response = await apiClient.get(`/candidates/${id}/analytics`)
    return response.data
  },
} 