import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UploadExcel from '../UploadExcel';

const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch);
  mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('UploadExcel', () => {
  it('renders the upload zone and environment/version inputs', () => {
    render(<UploadExcel />);
    expect(screen.getByText(/Drop \.xlsx file or click to upload/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/QA, Staging, Production/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/2\.4\.1/i)).toBeInTheDocument();
  });

  it('shows an error when a non-.xlsx file is dropped', () => {
    render(<UploadExcel />);
    const zone = screen.getByText(/Drop \.xlsx file or click to upload/i).closest('div.upload-zone') ||
                 screen.getByText(/Drop \.xlsx file or click to upload/i).parentElement;

    const file = new File(['content'], 'test.csv', { type: 'text/csv' });
    fireEvent.drop(zone, { dataTransfer: { files: [file] } });

    expect(screen.getByText(/Please upload a \.xlsx file\./i)).toBeInTheDocument();
  });

  it('loads saved settings from /api/settings on mount', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ testEnvironment: 'QA', softwareVersion: '1.2.3' }),
    });
    render(<UploadExcel />);
    await waitFor(() => {
      expect(screen.getByDisplayValue('QA')).toBeInTheDocument();
      expect(screen.getByDisplayValue('1.2.3')).toBeInTheDocument();
    });
  });

  it('shows importing status and then success after a valid xlsx upload', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ imported: 5 }) });

    render(<UploadExcel />);

    const input = document.querySelector('input[type="file"]');
    const file = new File(['fake'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    Object.defineProperty(input, 'files', { value: [file] });
    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByText(/Imported 5 test cases/i)).toBeInTheDocument();
    });
  });

  it('calls onImported callback after a successful import', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ imported: 3 }) });

    const onImported = vi.fn();
    render(<UploadExcel onImported={onImported} />);

    const input = document.querySelector('input[type="file"]');
    const file = new File(['fake'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    Object.defineProperty(input, 'files', { value: [file] });
    fireEvent.change(input);

    await waitFor(() => expect(onImported).toHaveBeenCalledTimes(1));
  });

  it('shows an error message when the import API returns an error', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'Sheet missing required columns' }) });

    render(<UploadExcel />);

    const input = document.querySelector('input[type="file"]');
    const file = new File(['fake'], 'report.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    Object.defineProperty(input, 'files', { value: [file] });
    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByText(/Sheet missing required columns/i)).toBeInTheDocument();
    });
  });
});
