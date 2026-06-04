'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Mail, ArrowRight, ShieldAlert, Loader2 } from 'lucide-react';
import AWSLogo from '@/components/AWSLogo';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed. Please check your credentials.');
        setLoading(false);
        return;
      }

      // Successful login, route to appropriate dashboard path
      router.push(redirectPath);
      router.refresh();
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred. Please try again later.');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col justify-center bg-slate-900 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative premium radial gradients & grids */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(15,41,99,0.4),transparent_70%)] pointer-events-none"></div>
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary-500 rounded-full filter blur-3xl opacity-20 -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent-red rounded-full filter blur-3xl opacity-15 translate-x-1/2 translate-y-1/2"></div>
      
      {/* School Name & Branding Section */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center flex flex-col items-center">
        <div className="mb-6 relative">
          <div className="absolute inset-0 bg-accent-gold/20 rounded-full filter blur-md animate-pulse"></div>
          <AWSLogo size="2xl" className="relative z-10 border-2 border-accent-gold shadow-2xl" />
        </div>
        
        <h2 className="text-3xl font-black text-white tracking-tight sm:text-4xl drop-shadow-md">
          ANGELS WORLD SCHOOL
        </h2>
        
        {/* Heraldic Motto Ribbon */}
        <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-red/90 border border-accent-gold/30 shadow-md">
          <span className="text-[10px] font-bold text-accent-gold uppercase tracking-widest leading-none">
            Be Humble • Fly High • Shine Bright
          </span>
        </div>
        
        <p className="mt-3 text-sm text-slate-300 font-medium">
          Premium Academic ERP & Management Portal
        </p>
      </div>

      {/* Login Card Form Container */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-950/80 backdrop-blur-md py-8 px-6 shadow-2xl border border-primary-500/20 rounded-3xl sm:px-10 hover-card">
          {error && (
            <div className="mb-6 bg-rose-950/40 border-l-4 border-accent-red p-4 rounded-2xl flex items-start gap-3">
              <ShieldAlert className="h-5 w-5 text-accent-red shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-rose-200">Login Authentication Error</h3>
                <p className="text-xs text-rose-300 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Email Address
              </label>
              <div className="mt-1.5 relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 bg-slate-900 border border-primary-500/20 rounded-xl text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-accent-gold focus:border-accent-gold focus:bg-slate-900/50 text-sm transition-all"
                  placeholder="admin@angels.edu.in"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Password
              </label>
              <div className="mt-1.5 relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 bg-slate-900 border border-primary-500/20 rounded-xl text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-accent-gold focus:border-accent-gold focus:bg-slate-900/50 text-sm transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-accent-gold/40 rounded-xl shadow-lg shadow-accent-red/20 text-sm font-bold text-white bg-gradient-to-r from-accent-red to-red-800 hover:from-red-600 hover:to-red-700 cursor-pointer disabled:bg-primary-900 disabled:cursor-not-allowed transition-all transform active:scale-98"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-accent-gold" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="h-4 w-4 text-accent-gold" />
                  </>
                )}
              </button>
            </div>
          </form>
          <p className="mt-6 text-center text-xs text-slate-400">
            Use the credentials issued by the school administrator.
          </p>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-accent-gold"></div>
      </div>
    }>
      <LoginContent />
    </React.Suspense>
  );
}
