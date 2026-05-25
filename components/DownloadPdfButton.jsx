'use client';

import DownloadIcon from '@mui/icons-material/Download';
import Button from '@mui/material/Button';
import { useState } from 'react';
import { showToast } from '@/components/Toast';
import { exportData } from '@/lib/api/exportData';
import { dateStamp } from '@/utils/formatters';
import { generateTestRunReport } from '@/utils/pdf/generateTestRunReport';

/**
 * @see {@link __tests__/components/DownloadPdfButton.test.jsx}
 */
export default function DownloadPdfButton({ run }) {
  const [downloading, setDownloading] = useState(false);

  async function handleClick() {
    setDownloading(true);
    try {
      const cases = await exportData({ testRunId: run._id });
      if (!cases.length) {
        showToast('No test cases for this run', 'info');
        return;
      }

      const doc = await generateTestRunReport({ run, cases });
      doc.save(`report-v${run.softwareVersion || 'NA'}-${dateStamp()}.pdf`);
      showToast('Report downloaded', 'success');
    } catch (e) {
      console.error(e);
      showToast('Download failed', 'error');
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Button
      variant='outlined'
      size='small'
      loading={downloading}
      loadingPosition='start'
      startIcon={<DownloadIcon />}
      onClick={handleClick}
      sx={{ whiteSpace: 'nowrap' }}
    >
      PDF
    </Button>
  );
}
