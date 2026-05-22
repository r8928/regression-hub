import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ImportCasesClient from '../ImportCasesClient';

vi.mock('@/components/UploadExcel', () => ({
  default: () => <div data-testid="upload-excel" />,
}));

vi.mock('@/components/Toast', () => ({
  default: () => null,
}));

describe('ImportCasesClient', () => {
  it('renders the "Import Test Cases" page header title', () => {
    render(<ImportCasesClient />);
    expect(screen.getByRole('heading', { name: 'Import Test Cases' })).toBeInTheDocument();
  });

  it('renders the UploadExcel component', () => {
    render(<ImportCasesClient />);
    expect(screen.getByTestId('upload-excel')).toBeInTheDocument();
  });

  it('renders correctly without any props', () => {
    render(<ImportCasesClient />);
    expect(screen.getByRole('heading', { name: 'Import Test Cases' })).toBeInTheDocument();
  });
});
