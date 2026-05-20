'use client';

import { signIn } from 'next-auth/react';
import { ArrowRight, ShieldCheck, Zap, Globe } from 'lucide-react';
import { motion } from 'framer-motion';

function LizRouterLogo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="loginLogoGrad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#c2185b" />
          <stop offset="100%" stopColor="#e91e8c" />
        </linearGradient>
      </defs>
      <rect x="6" y="18" width="36" height="16" rx="5" fill="url(#loginLogoGrad)" opacity="0.15" stroke="url(#loginLogoGrad)" strokeWidth="1.5" />
      <path d="M24 14 C18 14 13 17 10 22" stroke="url(#loginLogoGrad)" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.5" />
      <path d="M24 10 C15 10 8 15 5 22" stroke="url(#loginLogoGrad)" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.3" />
      <path d="M24 14 C30 14 35 17 38 22" stroke="url(#loginLogoGrad)" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.5" />
      <path d="M24 10 C33 10 40 15 43 22" stroke="url(#loginLogoGrad)" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.3" />
      <circle cx="24" cy="26" r="3.5" fill="url(#loginLogoGrad)" />
      <circle cx="14" cy="26" r="2" fill="url(#loginLogoGrad)" opacity="0.6" />
      <circle cx="34" cy="26" r="2" fill="url(#loginLogoGrad)" opacity="0.6" />
      <line x1="24" y1="18" x2="24" y2="10" stroke="url(#loginLogoGrad)" strokeWidth="2" strokeLinecap="round" />
      <circle cx="24" cy="9" r="2" fill="url(#loginLogoGrad)" />
    </svg>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: 'var(--background)' }}>
      {/* Background Glows */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        left: '-10%',
        width: '40%',
        height: '40%',
        background: 'radial-gradient(circle, rgba(194, 24, 91, 0.12) 0%, transparent 70%)',
        filter: 'blur(80px)',
        zIndex: 0
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-10%',
        right: '-10%',
        width: '40%',
        height: '40%',
        background: 'radial-gradient(circle, rgba(233, 30, 140, 0.10) 0%, transparent 70%)',
        filter: 'blur(80px)',
        zIndex: 0
      }} />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="glass-card w-full max-w-md relative z-10"
        style={{ padding: '48px', textAlign: 'center' }}
      >
        <div style={{ marginBottom: '32px' }}>
          <div style={{ 
            width: '72px', 
            height: '72px', 
            background: 'rgba(194, 24, 91, 0.08)',
            borderRadius: '20px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            margin: '0 auto 24px',
            border: '1px solid rgba(194, 24, 91, 0.2)',
            boxShadow: '0 4px 20px rgba(194, 24, 91, 0.12)'
          }}>
            <LizRouterLogo size={40} />
          </div>
          <h1 className="title-gradient" style={{ fontSize: '2rem', marginBottom: '12px' }}>Welcome Back</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Sign in to access your LizRouter dashboard</p>
        </div>

        <button 
          onClick={() => signIn('github', { callbackUrl: '/dashboard' })}
          className="btn-primary w-full"
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '12px', 
            padding: '16px', 
            fontSize: '1rem',
            width: '100%',
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.041-1.416-4.041-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
          Continue with GitHub
          <ArrowRight size={18} />
        </button>

        <div style={{ marginTop: '32px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          <div style={{ textAlign: 'center' }}>
            <Zap size={20} style={{ color: 'var(--primary)', marginBottom: '8px', margin: '0 auto' }} />
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Ultra Fast</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <ShieldCheck size={20} style={{ color: 'var(--primary)', marginBottom: '8px', margin: '0 auto' }} />
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Secure Auth</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <Globe size={20} style={{ color: 'var(--primary)', marginBottom: '8px', margin: '0 auto' }} />
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Edge Ready</p>
          </div>
        </div>

        <p style={{ marginTop: '40px', fontSize: '0.75rem', color: 'var(--text-muted)', opacity: 0.6 }}>
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </motion.div>
    </div>
  );
}
