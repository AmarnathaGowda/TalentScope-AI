import { AxiosResponse } from 'axios'
import apiClient from '../client'
import { JobDescription } from '../../store/slices/jobsSlice'

export const jobsService = {
  getJobs: async (): Promise<JobDescription[]> => {
    const response: AxiosResponse<JobDescription[]> = await apiClient.get('/jobs')
    return response.data
  },

  getJobById: async (id: number): Promise<JobDescription> => {
    const response: AxiosResponse<JobDescription> = await apiClient.get(`/jobs/${id}`)
    return response.data
  },

  createJob: async (job: Omit<JobDescription, 'id'>): Promise<JobDescription> => {
    const response: AxiosResponse<JobDescription> = await apiClient.post('/jobs', job)
    return response.data
  },

  updateJob: async (id: number, job: Partial<JobDescription>): Promise<JobDescription> => {
    const response: AxiosResponse<JobDescription> = await apiClient.put(`/jobs/${id}`, job)
    return response.data
  },

  deleteJob: async (id: number): Promise<void> => {
    await apiClient.delete(`/jobs/${id}`)
  },

  // Additional job-related API calls
  startInterviews: async (jobId: number, candidateIds: number[]): Promise<void> => {
    await apiClient.post(`/jobs/${jobId}/start-interviews`, { candidateIds })
  },

  generateQuestions: async (jobId: number): Promise<{
    id: number
    text: string
    type: 'technical' | 'behavioral' | 'experience'
  }[]> => {
    const response = await apiClient.get(`/jobs/${jobId}/generate-questions`)
    return response.data
  },

  getJobStats: async (jobId: number): Promise<{
    totalCandidates: number
    completedInterviews: number
    averageScore: number
    topCandidates: {
      id: number
      name: string
      score: number
    }[]
  }> => {
    const response = await apiClient.get(`/jobs/${jobId}/stats`)
    return response.data
  },
} 