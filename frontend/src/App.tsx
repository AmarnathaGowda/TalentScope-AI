import { Routes, Route } from 'react-router-dom'
import { Box } from '@mui/material'

// Layouts
import MainLayout from './layouts/MainLayout'

// Pages
import Dashboard from './pages/Dashboard'
import JobDescriptions from './pages/JobDescriptions'
import Interviews from './pages/Interviews'
import Candidates from './pages/Candidates'
import Settings from './pages/Settings'
import NotFound from './pages/NotFound'

function App() {
  return (
    <Box sx={{ display: 'flex' }}>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/job-descriptions" element={<JobDescriptions />} />
          <Route path="/interviews" element={<Interviews />} />
          <Route path="/candidates" element={<Candidates />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Box>
  )
}

export default App 