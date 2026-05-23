'use client';

import { STATUS } from '@/lib/constants';
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

const COLORS = {
  [STATUS.PASS]: '#16a34a',
  [STATUS.FAIL]: '#dc2626',
  [STATUS.PENDING]: '#d97706',
};

export function DonutChart({ donutData }) {
  return (
    <div className='panel'>
      <div className='panel-header'>
        <h3>Pass / Fail / Pending</h3>
      </div>
      <div className='panel-body' style={{ minHeight: 260 }}>
        {donutData.length ? (
          <ResponsiveContainer width='100%' height={240}>
            <PieChart>
              <Pie
                data={donutData}
                cx='50%'
                cy='50%'
                innerRadius={65}
                outerRadius={95}
                dataKey='value'
                paddingAngle={2}
              >
                {donutData.map((entry) => (
                  <Cell key={entry.name} fill={COLORS[entry.name]} />
                ))}
              </Pie>
              <Tooltip formatter={(v, n) => [v, n]} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className='empty-state'>
            No data yet — import an Excel file to begin.
          </div>
        )}
      </div>
    </div>
  );
}

export function ModuleBarChart({ moduleBarData }) {
  return (
    <div className='panel' style={{ marginBottom: 20 }}>
      <div className='panel-header'>
        <h3>Results by Module</h3>
      </div>
      <div className='panel-body'>
        {moduleBarData.length ? (
          <ResponsiveContainer width='100%' height={340}>
            <BarChart
              data={moduleBarData}
              margin={{ left: 0, bottom: 80, right: 20 }}
            >
              <CartesianGrid strokeDasharray='3 3' stroke='var(--line)' />
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
                  border: '1px solid var(--line)',
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
          <div className='empty-state'>No module data yet.</div>
        )}
      </div>
    </div>
  );
}
