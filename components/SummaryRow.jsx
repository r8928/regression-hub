'use client';

import { STATUS } from '@/lib/constants';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';

/**
 * Renders a summary row showing pass/fail/pending counts and a stacked status bar.
 *
 * @see components/__tests__/SummaryRow.test.jsx
 */
export default function SummaryRow({ name, passed, failed, pending, total }) {
  const theme = useTheme();
  const COLORS = {
    [STATUS.PASS]: theme.palette.pass.main,
    [STATUS.FAIL]: theme.palette.fail.main,
    [STATUS.PENDING]: theme.palette.pending.main,
  };

  const data = [
    { [STATUS.PASS]: passed, [STATUS.FAIL]: failed, [STATUS.PENDING]: pending },
  ];

  return (
    <Stack sx={{ width: '100%', mb: 3 }}>
      <Stack direction='row' spacing={2} sx={{ alignItems: 'center' }}>
        <Typography
          variant='tableCell'
          sx={{
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {name || 'Unassigned'}
        </Typography>
        <Stack direction='row' spacing={2} sx={{ flexShrink: 0 }}>
          <Typography
            variant='caption'
            sx={{ color: COLORS[STATUS.PASS], fontWeight: 600 }}
          >
            {passed} Pass
          </Typography>
          <Typography
            variant='caption'
            sx={{ color: COLORS[STATUS.FAIL], fontWeight: 600 }}
          >
            {failed} Fail
          </Typography>
          <Typography
            variant='caption'
            sx={{ color: COLORS[STATUS.PENDING], fontWeight: 600 }}
          >
            {pending} Pending
          </Typography>
        </Stack>
      </Stack>
      <ResponsiveContainer width='100%' height={4}>
        <BarChart
          layout='vertical'
          data={data}
          margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
          barSize={4}
        >
          <XAxis type='number' hide domain={[0, total || 1]} />
          <YAxis type='category' hide />
          <Bar
            dataKey={STATUS.PASS}
            stackId='a'
            fill={COLORS[STATUS.PASS]}
            isAnimationActive={false}
          />
          <Bar
            dataKey={STATUS.FAIL}
            stackId='a'
            fill={COLORS[STATUS.FAIL]}
            isAnimationActive={false}
          />
          <Bar
            dataKey={STATUS.PENDING}
            stackId='a'
            fill={COLORS[STATUS.PENDING]}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </Stack>
  );
}
