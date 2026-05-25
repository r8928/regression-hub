'use client';

import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import Alert from '@mui/material/Alert';
import Grid from '@mui/material/Grid';
import LinearProgress from '@mui/material/LinearProgress';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useCallback, useEffect, useRef, useState } from 'react';
import { importExcel } from '@/lib/api/importExcel';
import { getSettings, putSettings } from '@/lib/api/settings';

/** @see {@link __tests__/UploadExcel.test.jsx} */
export default function UploadExcel({ onImported }) {
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [env, setEnv] = useState('');
  const [version, setVersion] = useState('');
  const fileRef = useRef();
  const saveTimer = useRef(null);

  useEffect(() => {
    getSettings({ silentFailure: true }).then((s) => {
      if (!s) return;
      if (s.testEnvironment !== undefined) setEnv(s.testEnvironment);
      if (s.softwareVersion !== undefined) setVersion(s.softwareVersion);
    });
  }, []);

  const saveSettings = useCallback((testEnvironment, softwareVersion) => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      putSettings(
        { testEnvironment, softwareVersion },
        { silentFailure: true },
      );
    }, 600);
  }, []);

  function handleEnvChange(e) {
    const val = e.target.value;
    setEnv(val);
    saveSettings(val, version);
  }

  function handleVersionChange(e) {
    const val = e.target.value;
    setVersion(val);
    saveSettings(env, val);
  }

  async function processFile(file) {
    if (!file?.name.toLowerCase().endsWith('.xlsx')) {
      setStatus({ type: 'error', message: 'Please upload a .xlsx file.' });
      return;
    }
    setLoading(true);
    setStatus({ type: 'info', message: `Importing ${file.name}…` });
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('testEnvironment', env);
      form.append('softwareVersion', version);
      const data = await importExcel(form);
      setStatus({
        type: 'success',
        message: `✓ Imported ${data.imported} test cases.`,
      });
      onImported?.();
    } catch (e) {
      setStatus({ type: 'error', message: e.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Paper variant='outlined' sx={{ p: 2 }}>
      <Paper
        data-testid='upload-dropzone'
        variant='outlined'
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          processFile(e.dataTransfer.files[0]);
        }}
        sx={{
          border: '2px dashed',
          borderColor: dragging ? 'primary.main' : 'divider',
          borderRadius: 2,
          p: 3,
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'border-color 0.2s, background-color 0.2s',
          bgcolor: dragging ? 'action.hover' : 'background.paper',
          '&:hover': {
            borderColor: 'primary.light',
            bgcolor: 'action.hover',
          },
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <input
          ref={fileRef}
          type='file'
          accept='.xlsx'
          hidden
          onChange={(e) => {
            processFile(e.target.files[0]);
            e.target.value = '';
          }}
        />

        <CloudUploadIcon sx={{ fontSize: 36, color: 'primary.main', mb: 1 }} />

        <Typography variant='subtitle2' fontWeight={600}>
          Drop .xlsx file or click to upload
        </Typography>

        <Typography
          variant='caption'
          color='text.secondary'
          display='block'
          sx={{ mt: 0.5 }}
        >
          Auto-detects headers · Imports all sheets
        </Typography>

        {loading && (
          <LinearProgress
            sx={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}
          />
        )}
      </Paper>

      <Grid container spacing={1.25} sx={{ mt: 1.25 }}>
        <Grid size={6}>
          <TextField
            size='small'
            fullWidth
            label='Test Environment'
            value={env}
            onChange={handleEnvChange}
            placeholder='e.g. QA, Staging, Production'
          />
        </Grid>
        <Grid size={6}>
          <TextField
            size='small'
            fullWidth
            label='Software Version'
            value={version}
            onChange={handleVersionChange}
            placeholder='e.g. 2.4.1'
          />
        </Grid>
      </Grid>

      {status && (
        <Alert
          severity={status.type === 'info' ? 'info' : status.type}
          sx={{ mt: 1.25, mb: 0 }}
        >
          {status.message}
        </Alert>
      )}
    </Paper>
  );
}
