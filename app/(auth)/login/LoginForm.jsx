'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await signIn('credentials', {
      username,
      password,
      redirect: false,
    });
    setLoading(false);
    if (result?.error) {
      setError('Invalid username or password.');
    } else {
      router.push('/dashboard');
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
          Username
        </label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="e.g. qa-radius"
          required
          autoFocus
          style={{
            width: '100%',
            padding: '10px 14px',
            border: '1.5px solid #e2e8f0',
            borderRadius: 8,
            fontSize: 14,
            outline: 'none',
            boxSizing: 'border-box',
            transition: 'border-color 0.15s',
          }}
          onFocus={(e) => e.target.style.borderColor = '#0d9488'}
          onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
        />
      </div>

      <div style={{ marginBottom: 24 }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          required
          style={{
            width: '100%',
            padding: '10px 14px',
            border: '1.5px solid #e2e8f0',
            borderRadius: 8,
            fontSize: 14,
            outline: 'none',
            boxSizing: 'border-box',
            transition: 'border-color 0.15s',
          }}
          onFocus={(e) => e.target.style.borderColor = '#0d9488'}
          onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
        />
      </div>

      {error && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: 8,
          padding: '10px 14px',
          fontSize: 13,
          color: '#dc2626',
          marginBottom: 16,
        }}>
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        style={{
          width: '100%',
          padding: '11px',
          background: loading ? '#94a3b8' : 'linear-gradient(135deg, #0d9488, #0f766e)',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          fontSize: 15,
          fontWeight: 600,
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'opacity 0.15s',
        }}
      >
        {loading ? 'Signing in…' : 'Sign In'}
      </button>
    </form>
  );
}
