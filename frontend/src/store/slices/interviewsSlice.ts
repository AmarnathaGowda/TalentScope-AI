import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface Interview {
  id: number
  jobId: number
  candidateId: number
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled'
  scheduledAt: string
  completedAt?: string
  duration: number // in minutes
  score?: number
  feedback?: string
  videoUrl?: string
  questions: {
    id: number
    text: string
    type: 'technical' | 'behavioral' | 'experience'
    response?: string
    score?: number
  }[]
}

interface InterviewsState {
  items: Interview[]
  loading: boolean
  error: string | null
  currentInterview: Interview | null
}

const initialState: InterviewsState = {
  items: [],
  loading: false,
  error: null,
  currentInterview: null,
}

const interviewsSlice = createSlice({
  name: 'interviews',
  initialState,
  reducers: {
    setInterviews: (state, action: PayloadAction<Interview[]>) => {
      state.items = action.payload
      state.loading = false
      state.error = null
    },
    addInterview: (state, action: PayloadAction<Interview>) => {
      state.items.push(action.payload)
    },
    updateInterview: (state, action: PayloadAction<Interview>) => {
      const index = state.items.findIndex((interview) => interview.id === action.payload.id)
      if (index !== -1) {
        state.items[index] = action.payload
      }
    },
    deleteInterview: (state, action: PayloadAction<number>) => {
      state.items = state.items.filter((interview) => interview.id !== action.payload)
    },
    setCurrentInterview: (state, action: PayloadAction<Interview | null>) => {
      state.currentInterview = action.payload
    },
    updateInterviewScore: (state, action: PayloadAction<{ id: number; score: number; feedback: string }>) => {
      const interview = state.items.find((item) => item.id === action.payload.id)
      if (interview) {
        interview.score = action.payload.score
        interview.feedback = action.payload.feedback
        interview.status = 'completed'
        interview.completedAt = new Date().toISOString()
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
  setInterviews,
  addInterview,
  updateInterview,
  deleteInterview,
  setCurrentInterview,
  updateInterviewScore,
  setLoading,
  setError,
} = interviewsSlice.actions

export default interviewsSlice.reducer 
 