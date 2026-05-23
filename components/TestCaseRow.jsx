'use client';

import { priorityBadgeStyle } from '@/components/PriorityBadge';
import RichTextDisplay from '@/components/RichTextDisplay';
import { PRIORITIES, STATUS } from '@/lib/constants';
import { normalizedStatus, toDateInputValue } from '@/utils/formatters';
import { useEffect, useState } from 'react';

function statusClass(status) {
  if (status === STATUS.PASS) return 'pass';
  if (status === STATUS.FAIL) return 'fail';
  return 'pending';
}

export default function TestCaseRow({
  tc,
  rowNum,
  saving,
  onSave,
  onEdit,
  selected,
  onToggle,
  qaUsers,
}) {
  const [local, setLocal] = useState(tc);
  useEffect(() => {
    setLocal(tc);
  }, [tc]);

  function handleChange(field, value) {
    setLocal((prev) => ({ ...prev, [field]: value }));
    onSave(tc._id, field, value);
  }

  const st = normalizedStatus(local.status);
  const pStyle = priorityBadgeStyle(local.priority);

  return (
    <tr
      style={{
        opacity: saving ? 0.7 : 1,
        transition: 'opacity 200ms',
        background: selected
          ? 'color-mix(in srgb, var(--accent) 8%, transparent)'
          : undefined,
      }}
    >
      <td style={{ width: 36, textAlign: 'center', padding: '4px 6px' }}>
        <input type='checkbox' checked={selected} onChange={onToggle} />
      </td>
      <td
        style={{
          width: 40,
          textAlign: 'center',
          color: 'var(--muted)',
          fontSize: 12,
          userSelect: 'none',
        }}
      >
        {rowNum}
      </td>
      <td style={{ color: 'var(--ink-2)', minWidth: 110 }}>
        {tc.applicationName}
      </td>
      <td style={{ minWidth: 110 }}>{tc.moduleName}</td>
      <td style={{ minWidth: 90 }}>
        <select
          className='table-select'
          value={local.priority || ''}
          onChange={(e) => handleChange('priority', e.target.value)}
          style={{
            minWidth: 85,
            ...pStyle,
          }}
        >
          <option value=''>—</option>
          <option value={PRIORITIES.HIGH}>High</option>
          <option value={PRIORITIES.MEDIUM}>Medium</option>
          <option value={PRIORITIES.LOW}>Low</option>
        </select>
      </td>
      <td>{tc.type}</td>
      <td style={{ minWidth: 110 }}>
        <input
          className='table-input'
          style={{ minWidth: 100 }}
          value={local.jiraStory || ''}
          onChange={(e) =>
            setLocal((prev) => ({ ...prev, jiraStory: e.target.value }))
          }
          onBlur={(e) => {
            if (e.target.value !== tc.jiraStory)
              handleChange('jiraStory', e.target.value);
          }}
          placeholder='JIRA-…'
        />
      </td>
      <td className='font-mono' style={{ fontSize: 12 }}>
        {tc.traceability}
      </td>
      <td className='font-mono' style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
        {tc.testCaseId}
      </td>
      <td style={{ minWidth: 180, maxWidth: 220, fontSize: 12 }}>
        {tc.testCase}
      </td>
      <td style={{ minWidth: 160, maxWidth: 220 }}>
        <RichTextDisplay
          value={tc.preconditions}
          style={{ color: 'var(--muted)' }}
        />
      </td>
      <td style={{ minWidth: 160, maxWidth: 240 }}>
        <RichTextDisplay value={tc.steps} />
      </td>
      <td style={{ minWidth: 180, maxWidth: 240 }}>
        <RichTextDisplay value={tc.expectedResult} />
      </td>
      <td>
        <input
          className='table-input'
          style={{ minWidth: 140 }}
          value={local.actualResult || ''}
          onChange={(e) =>
            setLocal((prev) => ({ ...prev, actualResult: e.target.value }))
          }
          onBlur={(e) => {
            if (e.target.value !== tc.actualResult)
              handleChange('actualResult', e.target.value);
          }}
        />
      </td>
      <td>
        <select
          className={`table-select ${statusClass(st)}`}
          value={local.status || ''}
          onChange={(e) => handleChange('status', e.target.value)}
          style={{ minWidth: 85 }}
        >
          <option value=''>Pending</option>
          <option value={STATUS.PASS}>Pass</option>
          <option value={STATUS.FAIL}>Fail</option>
        </select>
      </td>
      <td>
        <input
          className='table-input'
          style={{ minWidth: 140 }}
          value={local.defectsImprovements || ''}
          onChange={(e) =>
            setLocal((prev) => ({
              ...prev,
              defectsImprovements: e.target.value,
            }))
          }
          onBlur={(e) => {
            if (e.target.value !== tc.defectsImprovements)
              handleChange('defectsImprovements', e.target.value);
          }}
        />
      </td>
      <td>
        <select
          className='table-select'
          value={local.testedBy || ''}
          onChange={(e) => handleChange('testedBy', e.target.value)}
          style={{ minWidth: 100 }}
        >
          <option value=''>—</option>
          {qaUsers.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
      </td>
      <td>
        <input
          className='table-date'
          type='date'
          value={toDateInputValue(local.testedOn)}
          onChange={(e) => handleChange('testedOn', e.target.value)}
          style={{ minWidth: 130 }}
        />
      </td>
      <td>
        <input
          className='table-input'
          style={{ minWidth: 100 }}
          value={local.softwareVersionTested || ''}
          onChange={(e) =>
            setLocal((prev) => ({
              ...prev,
              softwareVersionTested: e.target.value,
            }))
          }
          onBlur={(e) => {
            if (e.target.value !== tc.softwareVersionTested)
              handleChange('softwareVersionTested', e.target.value);
          }}
        />
      </td>
      <td style={{ textAlign: 'center', padding: '4px 8px' }}>
        <button
          onClick={() => onEdit(tc)}
          title='Edit test case'
          style={{
            background: 'none',
            border: '1px solid var(--line)',
            borderRadius: 6,
            cursor: 'pointer',
            padding: '3px 8px',
            fontSize: 13,
            color: 'var(--muted)',
            lineHeight: 1,
          }}
        >
          ✎
        </button>
      </td>
    </tr>
  );
}
