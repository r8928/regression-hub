import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ImportCasesClient from '../ImportCasesClient';

vi.mock('@/components/UploadExcel', () => ({
  default: () => <div data-testid='upload-excel' />,
}));

vi.mock('@/components/Toast', () => ({
  default: () => null,
}));

describe('ImportCasesClient', () => {
  it('renders the "Import Test Cases" page header title', () => {
    render(<ImportCasesClient />);
    // PageHeader uses <Typography variant="pageTitle"> which renders as <span>
    // without ThemeProvider — query by text content instead of heading role
    expect(screen.getByText('Import Test Cases')).toBeInTheDocument();
  });

  it('renders the UploadExcel component', () => {
    render(<ImportCasesClient />);
    expect(screen.getByTestId('upload-excel')).toBeInTheDocument();
  });

  it('renders correctly without any props', () => {
    render(<ImportCasesClient />);
    expect(screen.getByText('Import Test Cases')).toBeInTheDocument();
  });
});
