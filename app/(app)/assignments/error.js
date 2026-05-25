'use client';

import { Alert, Box, Button, Typography } from '@mui/material';

export default function AssignmentsError({ error, reset }) {
  return (
    <Box sx={{ p: 5, textAlign: 'center' }}>
      <Alert severity='error' sx={{ mb: 2, textAlign: 'left' }}>
        {error?.message || 'Something went wrong. Try refreshing the page.'}
      </Alert>
      <Typography
        variant='panelTitle'
        component='h2'
        gutterBottom
        display='block'
      >
        Failed to load assignments
      </Typography>
      <Button variant='contained' onClick={reset} sx={{ mt: 1 }}>
        Try again
      </Button>
    </Box>
  );
}
