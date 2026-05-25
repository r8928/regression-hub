import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

export default function PanelHeader({ children, actions }) {
  return (
    <Stack
      direction='row'
      sx={{
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 2,
        py: 1.5,
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Typography variant='panelTitle' component='h2'>
        {children}
      </Typography>
      {actions}
    </Stack>
  );
}
