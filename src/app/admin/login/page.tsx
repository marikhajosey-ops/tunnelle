'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Lock, ArrowRight } from 'lucide-react';

export default function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'enyapeakshit') {
      localStorage.setItem('admin_access', 'true');
      router.push('/admin');
    } else {
      setError('Invalid password');
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'radial-gradient(circle at center, #1a1a2e 0%, #0f0f1a 100%)'
    }}>
      <div className="glass-card" style={{ maxWidth: '400px', width: '90%', padding: '40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ 
            width: '64px', 
            height: '64px', 
            background: 'rgba(124, 58, 237, 0.1)', 
            borderRadius: '16px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            margin: '0 auto 16px',
            border: '1px solid rgba(124, 58, 237, 0.2)'
          }}>
            <Shield className="title-gradient" size={32} />
          </div>
          <h1 className="title-gradient" style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px' }}>Admin Access</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Enter password to access dashboard</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ position: 'relative' }}>
            <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="password" 
              className="input-field" 
              placeholder="Admin Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ paddingLeft: '48px' }}
              autoFocus
            />
          </div>

          {error && <p style={{ color: '#ff4d4d', fontSize: '0.8rem', textAlign: 'center' }}>{error}</p>}

          <button type="submit" className="btn-primary" style={{ height: '48px' }}>
            Enter Dashboard <ArrowRight size={18} />
          </button>
        </form>

        <p style={{ marginTop: '32px', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Unauthorized access is logged and tracked.
        </p>
      </div>
    </div>
  );
}
