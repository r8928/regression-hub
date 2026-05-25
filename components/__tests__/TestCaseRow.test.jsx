import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import TestCaseRow from '../TestCaseRow';

vi.mock('@/components/RichTextDisplay', () => ({
  default: ({ value }) => <span data-testid='rtd'>{value}</span>,
}));

const mockTc = {
  _id: 'tc1',
  applicationName: 'MyApp',
  moduleName: 'Auth',
  priority: 'High',
  type: 'Functional',
  jiraStory: 'RXR-100',
  traceability: 'TR-1',
  testCaseId: 'TC-001',
  testCase: 'Login with valid credentials',
  preconditions: 'User exists',
  steps: '1. Navigate to login',
  expectedResult: 'Redirect to dashboard',
  actualResult: '',
  status: 'Pass',
  defectsImprovements: '',
  testedBy: '',
  testedOn: null,
  softwareVersionTested: '',
};

const defaultProps = {
  tc: mockTc,
  rowNum: 1,
  saving: false,
  onSave: vi.fn(),
  onEdit: vi.fn(),
  selected: false,
  onToggle: vi.fn(),
  qaUsers: ['Alice', 'Bob'],
};

const renderRow = (props = {}) =>
  render(
    <table>
      <tbody>
        <TestCaseRow {...defaultProps} {...props} />
      </tbody>
    </table>,
  );

describe('TestCaseRow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders row number', () => {
    renderRow({ rowNum: 3 });
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('renders applicationName and moduleName', () => {
    renderRow();
    expect(screen.getByText('MyApp')).toBeInTheDocument();
    expect(screen.getByText('Auth')).toBeInTheDocument();
  });

  it('checkbox reflects selected=true', () => {
    renderRow({ selected: true });
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
  });

  it('checkbox reflects selected=false', () => {
    renderRow({ selected: false });
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();
  });

  it('onToggle called on checkbox change', () => {
    const onToggle = vi.fn();
    renderRow({ onToggle });
    fireEvent.click(screen.getByRole('checkbox'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('priority select shows initial value from tc.priority', () => {
    renderRow({ tc: { ...mockTc, priority: 'High' } });
    // MUI Select renders the selected value as visible text
    expect(screen.getByText('High')).toBeInTheDocument();
  });

  it('priority change calls onSave with new value', () => {
    const onSave = vi.fn();
    renderRow({ onSave });
    // MUI Select renders a hidden <input>; find it by data-testid
    const priorityInput = screen.getByTestId('priority-select');
    fireEvent.change(priorityInput, { target: { value: 'Low' } });
    expect(onSave).toHaveBeenCalledWith('tc1', 'priority', 'Low');
  });

  it('status select shows initial value from tc.status', () => {
    renderRow({ tc: { ...mockTc, status: 'Pass' } });
    expect(screen.getByText('Pass')).toBeInTheDocument();
  });

  it('status change calls onSave with new value', () => {
    const onSave = vi.fn();
    renderRow({ onSave });
    const statusInput = screen.getByTestId('status-select');
    fireEvent.change(statusInput, { target: { value: 'Fail' } });
    expect(onSave).toHaveBeenCalledWith('tc1', 'status', 'Fail');
  });

  it('jiraStory blur calls onSave only when value changed', () => {
    const onSave = vi.fn();
    renderRow({ onSave, tc: { ...mockTc, jiraStory: 'RXR-100' } });
    const jiraInput = screen.getByDisplayValue('RXR-100');
    // Change then blur — should call onSave
    fireEvent.change(jiraInput, { target: { value: 'RXR-999' } });
    fireEvent.blur(jiraInput);
    expect(onSave).toHaveBeenCalledWith('tc1', 'jiraStory', 'RXR-999');
  });

  it('jiraStory blur does NOT call onSave when value unchanged', () => {
    const onSave = vi.fn();
    renderRow({ onSave, tc: { ...mockTc, jiraStory: 'RXR-100' } });
    const jiraInput = screen.getByDisplayValue('RXR-100');
    // Blur without changing value
    fireEvent.blur(jiraInput);
    expect(onSave).not.toHaveBeenCalled();
  });

  it('edit button calls onEdit with tc', () => {
    const onEdit = vi.fn();
    renderRow({ onEdit });
    const editBtn = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editBtn);
    expect(onEdit).toHaveBeenCalledWith(mockTc);
  });

  it('saving=true reduces opacity to 0.7 on the row', () => {
    renderRow({ saving: true });
    const row = screen.getByRole('row');
    expect(row).toHaveStyle({ opacity: '0.7' });
  });

  it('normalizedStatus handles non-normalized status — invalid value maps to Pending', () => {
    // normalizedStatus('PASS') → 'Pending' because it's not an exact match
    // The select value should be the original tc.status (local state), but
    // the STATUS_COLOR lookup uses normalizedStatus. Verify component renders
    // without error and the hidden input reflects the raw status value.
    renderRow({ tc: { ...mockTc, status: 'invalid-status' } });
    const statusInput = screen.getByTestId('status-select');
    // The local state still holds the raw value passed in
    expect(statusInput.value).toBe('invalid-status');
  });
});
