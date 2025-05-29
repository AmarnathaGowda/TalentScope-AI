import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface Candidate {
  id: number
  firstName: string
  lastName: string
  email: string
  phone?: string
  experience: number // in years
  skills: string[]
  currentRole?: string
  currentCompany?: string
  location: string
  resumeUrl?: string
  status: 'new' | 'screening' | 'interviewed' | 'selected' | 'rejected'
  appliedJobs: number[] // job IDs
  interviewHistory: {
    interviewId: number
    jobId: number
    date: string
    status: string
    score?: number
  }[]
  createdAt: string
  updatedAt: string
}

interface CandidatesState {
  items: Candidate[]
  loading: boolean
  error: string | null
  selectedCandidate: Candidate | null
}

const initialState: CandidatesState = {
  items: [],
  loading: false,
  error: null,
  selectedCandidate: null,
}

const candidatesSlice = createSlice({
  name: 'candidates',
  initialState,
  reducers: {
    setCandidates: (state, action: PayloadAction<Candidate[]>) => {
      state.items = action.payload
      state.loading = false
      state.error = null
    },
    addCandidate: (state, action: PayloadAction<Candidate>) => {
      state.items.push(action.payload)
    },
    updateCandidate: (state, action: PayloadAction<Candidate>) => {
      const index = state.items.findIndex((candidate) => candidate.id === action.payload.id)
      if (index !== -1) {
        state.items[index] = action.payload
      }
    },
    deleteCandidate: (state, action: PayloadAction<number>) => {
      state.items = state.items.filter((candidate) => candidate.id !== action.payload)
    },
    setSelectedCandidate: (state, action: PayloadAction<Candidate | null>) => {
      state.selectedCandidate = action.payload
    },
    addInterviewToHistory: (
      state,
      action: PayloadAction<{
        candidateId: number
        interviewId: number
        jobId: number
        date: string
        status: string
        score?: number
      }>
    ) => {
      const candidate = state.items.find((item) => item.id === action.payload.candidateId)
      if (candidate) {
        candidate.interviewHistory.push({
          interviewId: action.payload.interviewId,
          jobId: action.payload.jobId,
          date: action.payload.date,
          status: action.payload.status,
          score: action.payload.score,
        })
      }
    },
    updateCandidateStatus: (
      state,
      action: PayloadAction<{ id: number; status: Candidate['status'] }>
    ) => {
      const candidate = state.items.find((item) => item.id === action.payload.id)
      if (candidate) {
        candidate.status = action.payload.status
        candidate.updatedAt = new Date().toISOString()
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload
      state.loading = false
    },
  },
})

export const {
  setCandidates,
  addCandidate,
  updateCandidate,
  deleteCandidate,
  setSelectedCandidate,
  addInterviewToHistory,
  updateCandidateStatus,
  setLoading,
  setError,
} = candidatesSlice.actions

export default candidatesSlice.reducer 