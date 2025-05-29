import { configureStore } from '@reduxjs/toolkit'
import jobsReducer from './slices/jobsSlice'
import interviewsReducer from './slices/interviewsSlice'
import candidatesReducer from './slices/candidatesSlice'

export const store = configureStore({
  reducer: {
    jobs: jobsReducer,
    interviews: interviewsReducer,
    candidates: candidatesReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch 