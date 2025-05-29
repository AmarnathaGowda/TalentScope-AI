import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface JobDescription {
  id: number
  title: string
  department: string
  location: string
  experience: string
  skills: string[]
  description: string
  requirements: string
  status: 'active' | 'draft' | 'closed'
  createdAt: string
  updatedAt: string
}

interface JobsState {
  items: JobDescription[]
  loading: boolean
  error: string | null
}

const initialState: JobsState = {
  items: [],
  loading: false,
  error: null,
}

const jobsSlice = createSlice({
  name: 'jobs',
  initialState,
  reducers: {
    setJobs: (state, action: PayloadAction<JobDescription[]>) => {
      state.items = action.payload
      state.loading = false
      state.error = null
    },
    addJob: (state, action: PayloadAction<JobDescription>) => {
      state.items.push(action.payload)
    },
    updateJob: (state, action: PayloadAction<JobDescription>) => {
      const index = state.items.findIndex((job) => job.id === action.payload.id)
      if (index !== -1) {
        state.items[index] = action.payload
      }
    },
    deleteJob: (state, action: PayloadAction<number>) => {
      state.items = state.items.filter((job) => job.id !== action.payload)
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

export const { setJobs, addJob, updateJob, deleteJob, setLoading, setError } = jobsSlice.actions

export default jobsSlice.reducer 