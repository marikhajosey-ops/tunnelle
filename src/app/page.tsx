'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Shield, Rocket, ChevronRight } from 'lucide-react';

function LizRouterLogo({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="logoGrad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#c2185b" />
          <stop offset="100%" stopColor="#e91e8c" />
        </linearGradient>
      </defs>
      {/* Router base */}
      <rect x="6" y="18" width="36" height="16" rx="5" fill="url(#logoGrad)" opacity="0.15" stroke="url(#logoGrad)" strokeWidth="1.5" />
      {/* Signal arcs */}
      <path d="M24 14 C18 14 13 17 10 22" stroke="url(#logoGrad)" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.5" />
      <path d="M24 10 C15 10 8 15 5 22" stroke="url(#logoGrad)" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.3" />
      <path d="M24 14 C30 14 35 17 38 22" stroke="url(#logoGrad)" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.5" />
      <path d="M24 10 C33 10 40 15 43 22" stroke="url(#logoGrad)" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.3" />
      {/* Center dot */}
      <circle cx="24" cy="26" r="3.5" fill="url(#logoGrad)" />
      {/* LED dots */}
      <circle cx="14" cy="26" r="2" fill="url(#logoGrad)" opacity="0.6" />
      <circle cx="34" cy="26" r="2" fill="url(#logoGrad)" opacity="0.6" />
      {/* Antenna */}
      <line x1="24" y1="18" x2="24" y2="10" stroke="url(#logoGrad)" strokeWidth="2" strokeLinecap="round" />
      <circle cx="24" cy="9" r="2" fill="url(#logoGrad)" />
    </svg>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isAdmin, setIsAdmin] = useState(false);
  const [password, setPassword] = useState('');

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('admin_access', 'true');
        router.push('/admin');
      } else {
        alert('Invalid admin password');
      }
    } catch (err) {
      alert('Connection error');
    }
  };

  return (
    <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '100px 20px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div className="grid-bg"></div>
      
      <div style={{ textAlign: 'center', marginBottom: '80px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          <LizRouterLogo size={72} />
        </div>
        <h1 className="title-gradient" style={{ fontSize: 'clamp(3rem, 10vw, 5rem)', marginBottom: '16px', letterSpacing: '-2px' }}>LizRouter</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.25rem', maxWidth: '600px', margin: '0 auto' }}>
          The power of elite AI, delivered through a secure, high-performance gateway.
        </p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', flex: 1 }}>
        <div className="glass-card" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '40px', maxWidth: '420px', width: '100%' }}>
          <div style={{ background: 'rgba(194, 24, 91, 0.08)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', border: '1px solid rgba(194, 24, 91, 0.15)' }}>
            <Shield style={{ color: 'var(--primary)' }} />
          </div>
          <h3 style={{ marginBottom: '12px', fontSize: '1.5rem', color: 'var(--foreground)' }}>Admin Panel</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '32px', fontSize: '0.95rem', lineHeight: '1.6' }}>
            Configure upstream providers, manage system models, and generate redeem codes.
          </p>
          
          {!isAdmin ? (
            <button className="btn-primary" style={{ width: '100%' }} onClick={() => setIsAdmin(true)}>
              Admin Login <Shield size={16} />
            </button>
          ) : (
            <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input 
                type="password" 
                className="input-field" 
                placeholder="Enter password..." 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
              <button type="submit" className="btn-primary" style={{ width: '100%' }}>Login</button>
            </form>
          )}
        </div>
      </div>

      <footer style={{ marginTop: '100px', paddingBottom: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
        <p>© 2026 LizRouter. All models integrated from private elite endpoints.</p>
      </footer>
    </main>
  );
}
