import React, { useState } from 'react'
import {
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Paper,
  TextField,
  Typography,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Chip,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  VideoCall as VideoCallIcon,
} from '@mui/icons-material'

interface JobDescription {
  id: number
  title: string
  department: string
  location: string
  experience: string
  skills: string[]
  description: string
  requirements: string
  status: 'active' | 'draft' | 'closed'
}

const initialJobs: JobDescription[] = [
  {
    id: 1,
    title: 'Senior React Developer',
    department: 'Engineering',
    location: 'Remote',
    experience: '5+ years',
    skills: ['React', 'TypeScript', 'Node.js', 'AWS'],
    description: 'We are looking for a Senior React Developer to join our team...',
    requirements: '- 5+ years of experience with React\n- Strong TypeScript skills\n- Experience with cloud services',
    status: 'active',
  },
  {
    id: 2,
    title: 'Product Manager',
    department: 'Product',
    location: 'New York',
    experience: '3-5 years',
    skills: ['Product Management', 'Agile', 'Data Analysis'],
    description: 'Seeking an experienced Product Manager to drive product strategy...',
    requirements: '- 3+ years of product management experience\n- Strong analytical skills\n- Experience with Agile methodologies',
    status: 'active',
  },
]

const JobDescriptions: React.FC = () => {
  const [jobs, setJobs] = useState<JobDescription[]>(initialJobs)
  const [open, setOpen] = useState(false)
  const [selectedJob, setSelectedJob] = useState<JobDescription | null>(null)

  const handleClickOpen = () => {
    setSelectedJob(null)
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
    setSelectedJob(null)
  }

  const handleEdit = (job: JobDescription) => {
    setSelectedJob(job)
    setOpen(true)
  }

  const handleDelete = (id: number) => {
    setJobs(jobs.filter((job) => job.id !== id))
  }

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault()
    // Handle form submission
    handleClose()
  }

  const handleStartInterviews = (jobId: number) => {
    // Handle starting interviews for this job
    console.log('Starting interviews for job:', jobId)
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ pt: 4, pb: 8 }}>
        <Grid container justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
          <Grid item>
            <Typography variant="h4">Job Descriptions</Typography>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleClickOpen}
            >
              Add New Job
            </Button>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          {jobs.map((job) => (
            <Grid item xs={12} md={6} key={job.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6">{job.title}</Typography>
                    <Chip
                      label={job.status}
                      color={job.status === 'active' ? 'success' : 'default'}
                      size="small"
                    />
                  </Box>
                  <Typography color="text.secondary" gutterBottom>
                    {job.department} • {job.location} • {job.experience}
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    {job.skills.map((skill) => (
                      <Chip
                        key={skill}
                        label={skill}
                        size="small"
                        sx={{ mr: 0.5, mb: 0.5 }}
                      />
                    ))}
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {job.description.substring(0, 150)}...
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    startIcon={<VideoCallIcon />}
                    onClick={() => handleStartInterviews(job.id)}
                  >
                    Start Interviews
                  </Button>
                  <IconButton size="small" onClick={() => handleEdit(job)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDelete(job.id)}>
                    <DeleteIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Add/Edit Job Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>{selectedJob ? 'Edit Job' : 'Add New Job'}</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSave} sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Job Title"
                  defaultValue={selectedJob?.title}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Department"
                  defaultValue={selectedJob?.department}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Location"
                  defaultValue={selectedJob?.location}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Experience Required"
                  defaultValue={selectedJob?.experience}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Skills (comma-separated)"
                  defaultValue={selectedJob?.skills.join(', ')}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Job Description"
                  multiline
                  rows={4}
                  defaultValue={selectedJob?.description}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Requirements"
                  multiline
                  rows={4}
                  defaultValue={selectedJob?.requirements}
                  required
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" color="primary">
            {selectedJob ? 'Save Changes' : 'Add Job'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

export default JobDescriptions 