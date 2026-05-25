'use client';

import { useState } from 'react';
import { Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import Panel from '@/components/Panel';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { STATUS } from '@/lib/constants';
import { useRouter } from 'next/navigation';

export function DonutChart({ donutData }) {
  const theme = useTheme();
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(null);

  const COLORS = {
    [STATUS.PASS]: theme.palette.pass.main,
    [STATUS.FAIL]: theme.palette.fail.main,
    [STATUS.PENDING]: theme.palette.pending.main,
  };

  return (
    <Panel title='Pass / Fail / Pending'>
      <Box sx={{ p: 2.5, height: 280 }}>
        {donutData.length ? (
          <ResponsiveContainer width='100%' height='100%'>
            <PieChart>
              <Pie
                data={donutData}
                cx='50%'
                cy='50%'
                innerRadius={65}
                outerRadius={95}
                dataKey='value'
                paddingAngle={2}
                activeIndex={activeIndex}
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
                onClick={(data) =>
                  router.push(`/test-cases?status=${data.name}`)
                }
              >
                {donutData.map((entry) => (
                  <Cell key={entry.name} fill={COLORS[entry.name]} />
                ))}
              </Pie>
              <Tooltip content={<DonutTooltip allData={donutData} />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <Box sx={{ py: 5, textAlign: 'center' }}>
            <Typography variant='emptyStateTitle' color='text.disabled'>
              No data yet — import an Excel file to begin.
            </Typography>
          </Box>
        )}
      </Box>
    </Panel>
  );
}

function DonutTooltip({ active, payload, allData }) {
  const theme = useTheme();
  if (!active || !payload?.length) return null;
  const hoveredName = payload[0].payload.name;
  const COLORS = {
    [STATUS.PASS]: theme.palette.pass.main,
    [STATUS.FAIL]: theme.palette.fail.main,
    [STATUS.PENDING]: theme.palette.pending.main,
  };
  const total = allData[0]?.total ?? 0;
  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        p: 1,
        fontSize: 12,
      }}
    >
      <Typography variant='body2' fontWeight={700} mb={0.5}>
        Total: {total} tests
      </Typography>
      {allData.map(({ name, value, total }) => {
        const isHovered = name === hoveredName;
        const pct = total ? parseFloat(((value / total) * 100).toFixed(1)) : 0;
        return (
          <Typography
            key={name}
            variant='body2'
            fontWeight={isHovered ? 700 : 400}
            sx={{ color: isHovered ? COLORS[name] : 'text.secondary' }}
          >
            {name}: {pct}% ({value} tests)
          </Typography>
        );
      })}
    </Box>
  );
}

function AppBarTooltip({ active, payload, label, hoveredStatus }) {
  const theme = useTheme();
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  const COLORS = {
    [STATUS.PASS]: theme.palette.pass.main,
    [STATUS.FAIL]: theme.palette.fail.main,
    [STATUS.PENDING]: theme.palette.pending.main,
  };
  const rows = [
    { status: STATUS.PASS, pct: data[STATUS.PASS], count: data.passCount },
    { status: STATUS.FAIL, pct: data[STATUS.FAIL], count: data.failCount },
    {
      status: STATUS.PENDING,
      pct: data[STATUS.PENDING],
      count: data.pendingCount,
    },
  ];
  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        p: 1,
        fontSize: 12,
      }}
    >
      <Typography variant='body2' fontWeight='bold' mb={0.5}>
        {label}
      </Typography>
      {rows.map(({ status, pct, count }) => {
        const active = hoveredStatus === status;
        return (
          <Typography
            key={status}
            variant='body2'
            fontWeight={active ? 700 : 400}
            sx={{ color: active ? COLORS[status] : 'text.secondary' }}
          >
            {status}: {pct}% ({count} tests)
          </Typography>
        );
      })}
    </Box>
  );
}

export function AppStackedBarChart({ appBarData = [] }) {
  const theme = useTheme();
  const router = useRouter();
  const [hoveredStatus, setHoveredStatus] = useState(null);

  const COLORS = {
    [STATUS.PASS]: theme.palette.pass.main,
    [STATUS.FAIL]: theme.palette.fail.main,
    [STATUS.PENDING]: theme.palette.pending.main,
  };

  return (
    <Panel title='Application Summary'>
      <Box sx={{ p: 2.5, height: 280 }}>
        {appBarData.length === 0 ? (
          <Box sx={{ py: 5, textAlign: 'center' }}>
            <Typography variant='emptyStateTitle' color='text.disabled'>
              No data yet — import an Excel file to begin.
            </Typography>
          </Box>
        ) : (
          <ResponsiveContainer width='100%' height='100%'>
            <BarChart
              data={appBarData}
              onMouseLeave={() => setHoveredStatus(null)}
            >
              <CartesianGrid
                strokeDasharray='3 3'
                stroke={theme.palette.divider}
              />
              <XAxis dataKey='name' tick={{ fontSize: 11 }} />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                content={<AppBarTooltip hoveredStatus={hoveredStatus} />}
              />
              <Bar
                dataKey={STATUS.PASS}
                stackId='a'
                fill={COLORS[STATUS.PASS]}
                cursor='pointer'
                onMouseEnter={() => setHoveredStatus(STATUS.PASS)}
                onClick={(data) => {
                  if (data?.appId)
                    router.push(
                      `/test-cases?applicationId=${data.appId}&status=${STATUS.PASS}`,
                    );
                }}
              />
              <Bar
                dataKey={STATUS.FAIL}
                stackId='a'
                fill={COLORS[STATUS.FAIL]}
                cursor='pointer'
                onMouseEnter={() => setHoveredStatus(STATUS.FAIL)}
                onClick={(data) => {
                  if (data?.appId)
                    router.push(
                      `/test-cases?applicationId=${data.appId}&status=${STATUS.FAIL}`,
                    );
                }}
              />
              <Bar
                dataKey={STATUS.PENDING}
                stackId='a'
                fill={COLORS[STATUS.PENDING]}
                cursor='pointer'
                onMouseEnter={() => setHoveredStatus(STATUS.PENDING)}
                onClick={(data) => {
                  if (data?.appId)
                    router.push(
                      `/test-cases?applicationId=${data.appId}&status=${STATUS.PENDING}`,
                    );
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Box>
    </Panel>
  );
}

function TesterTooltip({ active, payload, label, hoveredStatus }) {
  const theme = useTheme();
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  const COLORS = {
    [STATUS.PASS]: theme.palette.pass.main,
    [STATUS.FAIL]: theme.palette.fail.main,
    [STATUS.PENDING]: theme.palette.pending.main,
  };
  const rows = [
    { status: STATUS.PASS, count: data[STATUS.PASS] },
    { status: STATUS.FAIL, count: data[STATUS.FAIL] },
    { status: STATUS.PENDING, count: data[STATUS.PENDING] },
  ];
  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        p: 1,
        fontSize: 12,
      }}
    >
      <Typography variant='body2' fontWeight={700} mb={0.25}>
        {label || 'Unassigned'}
      </Typography>
      <Typography variant='body2' color='text.secondary' mb={0.5}>
        Total: {data.total} tests
      </Typography>
      {rows.map(({ status, count }) => {
        const isHovered = hoveredStatus === status;
        return (
          <Typography
            key={status}
            variant='body2'
            fontWeight={isHovered ? 700 : 400}
            sx={{ color: isHovered ? COLORS[status] : 'text.secondary' }}
          >
            {status}: {count}
          </Typography>
        );
      })}
    </Box>
  );
}

export function TesterBarChart({ testerBarData = [] }) {
  const theme = useTheme();
  const router = useRouter();
  const [hoveredStatus, setHoveredStatus] = useState(null);

  const COLORS = {
    [STATUS.PASS]: theme.palette.pass.main,
    [STATUS.FAIL]: theme.palette.fail.main,
    [STATUS.PENDING]: theme.palette.pending.main,
  };

  return (
    <Panel title='QA Tester Summary'>
      <Box sx={{ p: 2.5, height: 280 }}>
        {testerBarData.length === 0 ? (
          <Box sx={{ py: 5, textAlign: 'center' }}>
            <Typography variant='emptyStateTitle' color='text.disabled'>
              No data yet — import an Excel file to begin.
            </Typography>
          </Box>
        ) : (
          <ResponsiveContainer width='100%' height='100%'>
            <BarChart
              data={testerBarData}
              layout='vertical'
              margin={{ left: 0, right: 16, top: 0, bottom: 0 }}
              onMouseLeave={() => setHoveredStatus(null)}
            >
              <CartesianGrid
                strokeDasharray='3 3'
                stroke={theme.palette.divider}
                horizontal={false}
              />
              <XAxis type='number' tick={{ fontSize: 11 }} />
              <YAxis
                type='category'
                dataKey='name'
                tick={{ fontSize: 11 }}
                width={110}
                tickFormatter={(v) => v || 'Unassigned'}
              />
              <Tooltip
                content={<TesterTooltip hoveredStatus={hoveredStatus} />}
              />
              <Bar
                dataKey={STATUS.PASS}
                stackId='a'
                fill={COLORS[STATUS.PASS]}
                cursor='pointer'
                onMouseEnter={() => setHoveredStatus(STATUS.PASS)}
                onClick={(data) =>
                  router.push(
                    `/test-cases?testedBy=${encodeURIComponent(data.name ?? '')}&status=${STATUS.PASS}`,
                  )
                }
              />
              <Bar
                dataKey={STATUS.FAIL}
                stackId='a'
                fill={COLORS[STATUS.FAIL]}
                cursor='pointer'
                onMouseEnter={() => setHoveredStatus(STATUS.FAIL)}
                onClick={(data) =>
                  router.push(
                    `/test-cases?testedBy=${encodeURIComponent(data.name ?? '')}&status=${STATUS.FAIL}`,
                  )
                }
              />
              <Bar
                dataKey={STATUS.PENDING}
                stackId='a'
                fill={COLORS[STATUS.PENDING]}
                cursor='pointer'
                onMouseEnter={() => setHoveredStatus(STATUS.PENDING)}
                onClick={(data) =>
                  router.push(
                    `/test-cases?testedBy=${encodeURIComponent(data.name ?? '')}&status=${STATUS.PENDING}`,
                  )
                }
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Box>
    </Panel>
  );
}

export function ModuleBarChart({ moduleBarData }) {
  const theme = useTheme();
  const COLORS = {
    [STATUS.PASS]: theme.palette.pass.main,
    [STATUS.FAIL]: theme.palette.fail.main,
    [STATUS.PENDING]: theme.palette.pending.main,
  };

  return (
    <Panel title='Results by Module'>
      <Box sx={{ p: 2.5 }}>
        {moduleBarData.length ? (
          <ResponsiveContainer width='100%' height={340}>
            <BarChart
              data={moduleBarData}
              margin={{ left: 0, bottom: 80, right: 20 }}
            >
              <CartesianGrid
                strokeDasharray='3 3'
                stroke={theme.palette.divider}
              />
              <XAxis
                dataKey='name'
                tick={{ fontSize: 11 }}
                angle={-35}
                textAnchor='end'
                interval={0}
              />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(value, name) => [value, name]}
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 8,
                  border: `1px solid ${theme.palette.divider}`,
                }}
              />
              <Legend
                verticalAlign='top'
                height={32}
                formatter={(value) => (
                  <span style={{ fontSize: 12 }}>{value}</span>
                )}
              />
              <Bar
                dataKey={STATUS.PASS}
                stackId='a'
                fill={COLORS[STATUS.PASS]}
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey={STATUS.FAIL}
                stackId='a'
                fill={COLORS[STATUS.FAIL]}
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey={STATUS.PENDING}
                stackId='a'
                fill={COLORS[STATUS.PENDING]}
                radius={[3, 3, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <Box sx={{ py: 5, textAlign: 'center' }}>
            <Typography variant='emptyStateTitle' color='text.disabled'>
              No data yet — import an Excel file to begin.
            </Typography>
          </Box>
        )}
      </Box>
    </Panel>
  );
}
