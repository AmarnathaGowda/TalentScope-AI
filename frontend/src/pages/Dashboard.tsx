import React from 'react'
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
} from '@mui/material'
import {
  Person as PersonIcon,
  Description as DescriptionIcon,
  VideoCall as VideoCallIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material'

const statsData = [
  { title: 'Active Interviews', count: 24, icon: <VideoCallIcon color="primary" /> },
  { title: 'Job Descriptions', count: 12, icon: <DescriptionIcon color="secondary" /> },
  { title: 'Total Candidates', count: 156, icon: <PersonIcon color="success" /> },
  { title: 'Completed Interviews', count: 89, icon: <CheckCircleIcon color="info" /> },
]

const recentActivities = [
  {
    id: 1,
    type: 'interview',
    title: 'Senior React Developer',
    candidate: 'John Doe',
    status: 'Completed',
    timestamp: '2 hours ago',
  },
  {
    id: 2,
    type: 'job',
    title: 'DevOps Engineer',
    action: 'New position added',
    timestamp: '4 hours ago',
  },
  {
    id: 3,
    type: 'interview',
    title: 'Product Manager',
    candidate: 'Jane Smith',
    status: 'Scheduled',
    timestamp: '6 hours ago',
  },
]

const Dashboard: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ pt: 4, pb: 8 }}>
        <Typography variant="h4" sx={{ mb: 4 }}>
          Dashboard
        </Typography>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {statsData.map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Paper
                sx={{
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  height: '100%',
                }}
              >
                <Box sx={{ mb: 1 }}>{stat.icon}</Box>
                <Typography variant="h4" component="div">
                  {stat.count}
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                  {stat.title}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Recent Activities */}
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Recent Activities
            </Typography>
            <List>
              {recentActivities.map((activity) => (
                <ListItem key={activity.id} divider>
                  <ListItemAvatar>
                    <Avatar>
                      {activity.type === 'interview' ? (
                        <VideoCallIcon />
                      ) : (
                        <DescriptionIcon />
                      )}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={activity.title}
                    secondary={
                      <>
                        {activity.candidate && `Candidate: ${activity.candidate}`}
                        {activity.action}
                        <Typography
                          component="span"
                          variant="body2"
                          color="text.secondary"
                          sx={{ display: 'block' }}
                        >
                          {activity.timestamp}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </Box>
    </Container>
  )
}

export default Dashboard 