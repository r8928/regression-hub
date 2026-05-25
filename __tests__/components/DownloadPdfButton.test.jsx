import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/utils/pdf/generateTestRunReport', () => ({
  generateTestRunReport: vi.fn(),
}));
vi.mock('@/components/Toast', () => ({
  default: () => null,
  showToast: vi.fn(),
}));
vi.mock('@/lib/api/exportData', () => ({
  exportData: vi.fn(),
}));

import DownloadPdfButton from '@/components/DownloadPdfButton';
import { showToast } from '@/components/Toast';
import { exportData } from '@/lib/api/exportData';
import { generateTestRunReport } from '@/utils/pdf/generateTestRunReport';

const mockRun = {
  _id: 'run1',
  uploadedFileName: 'test.xlsx',
  testEnvironment: 'QA',
  softwareVersion: '1.0',
  createdAt: new Date().toISOString(),
};

describe('DownloadPdfButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    exportData.mockResolvedValue([]);
    generateTestRunReport.mockResolvedValue({ save: vi.fn() });
  });

  it('renders the PDF button', () => {
    render(<DownloadPdfButton run={mockRun} />);
    expect(screen.getByRole('button', { name: /PDF/i })).toBeInTheDocument();
  });

  it('disables the button while downloading (MUI loading prop)', async () => {
    exportData.mockImplementation(() => new Promise(() => {}));
    render(<DownloadPdfButton run={mockRun} />);
    fireEvent.click(screen.getByRole('button'));
    // MUI <Button loading> sets aria-disabled and disabled on the root element
    await waitFor(() => expect(screen.getByRole('button')).toBeDisabled());
  });

  it('calls showToast with info when no cases returned', async () => {
    exportData.mockResolvedValue([]);
    render(<DownloadPdfButton run={mockRun} />);
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() =>
      expect(showToast).toHaveBeenCalledWith(
        'No test cases for this run',
        'info',
      ),
    );
  });

  it('calls showToast with error when fetch throws', async () => {
    exportData.mockRejectedValue(new Error('Network error'));
    render(<DownloadPdfButton run={mockRun} />);
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() =>
      expect(showToast).toHaveBeenCalledWith('Download failed', 'error'),
    );
  });

  it('calls showToast with success and resets button after successful download', async () => {
    const save = vi.fn();
    generateTestRunReport.mockResolvedValue({ save });
    exportData.mockResolvedValue([
      {
        _id: '1',
        status: 'Pass',
        applicationName: 'App',
        moduleName: 'Mod',
        testCaseId: 'TC1',
        testCase: 'Test',
        defectsImprovements: '',
      },
    ]);

    render(<DownloadPdfButton run={mockRun} />);
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() =>
      expect(showToast).toHaveBeenCalledWith('Report downloaded', 'success'),
    );
    expect(generateTestRunReport).toHaveBeenCalledWith({
      run: mockRun,
      cases: expect.any(Array),
    });
    expect(save).toHaveBeenCalled();
    // MUI Button label is static "PDF" (Unicode arrow replaced by DownloadIcon)
    expect(screen.getByRole('button', { name: /PDF/i })).toBeInTheDocument();
  });
});
