'use client';
import { useTheme } from '@mui/material/styles';
import NextTopLoader from 'nextjs-toploader';

export default function ThemeTopLoader() {
  const theme = useTheme();
  return (
    <NextTopLoader color={theme.palette.primary.main} showSpinner={false} />
  );
}
