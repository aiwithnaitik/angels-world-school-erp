'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  Settings,
  Building,
  Mail,
  Phone,
  Calendar,
  Lock,
  Loader2,
  CheckCircle,
  FileCheck2,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import AWSLogo from '@/components/AWSLogo';

export default function SettingsPanel() {
  const { user } = useAuth();
  
  const [settings, setSettings] = useState<Record<string, string>>({
    school_name: 'Angels World School',
    school_address: 'Sector 20, Panchkula, Haryana, India',
    school_phone: '+91 172 257 8899',
    school_email: 'info@angels.edu.in',
    active_session: '2026-2027',
    school_logo: ''
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passSubmitting, setPassSubmitting] = useState(false);
  const [passError, setPassError] = useState('');

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(prev => ({ ...prev, ...data }));
      }
    } catch (e) {
      showToast('Connection failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSettingChange = async (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user?.role !== 'ADMIN') {
      showToast('Forbidden: Only Administrators can update metadata', 'error');
      return;
    }

    setSaving(true);
    try {
      // Save all fields sequentially
      for (const [key, value] of Object.entries(settings)) {
        await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key, value })
        });
      }
      showToast('School settings registered successfully', 'success');
      loadSettings();
    } catch (e) {
      showToast('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('');

    if (newPassword !== confirmPassword) {
      setPassError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setPassError('Password must be at least 6 characters long');
      return;
    }

    setPassSubmitting(true);
    // Simple mock change for the demonstration
    setTimeout(() => {
      showToast('Password updated successfully', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPassSubmitting(false);
    }, 1000);
  };

  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="space-y-6 relative">
      {/* Toast popup */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border animate-bounce ${
          toast.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' :
          toast.type === 'error' ? 'bg-rose-50 border-rose-100 text-rose-800' :
          'bg-blue-50 border-blue-100 text-blue-800'
        }`}>
          <span className="text-sm font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 border border-slate-100 rounded-3xl shadow-xs">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary-500" />
            System Control Panel
          </h1>
          <p className="text-xs text-slate-500 mt-1">Configure school details, logo parameters, and credentials security</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* School Information config */}
        <div className="lg:col-span-2 bg-white p-6 border border-slate-100 rounded-3xl shadow-xs hover-card">
          <div className="border-b border-slate-50 pb-3 mb-5 flex items-center justify-between">
            <h3 className="font-extrabold text-slate-800 text-sm md:text-base flex items-center gap-2">
              <Building className="h-4 w-4 text-primary-500" />
              School Profile Metadata
            </h3>
            <span className="text-[9px] text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full font-bold uppercase">Configure</span>
          </div>

          {loading ? (
            <div className="p-12 text-center flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
              <span className="text-xs text-slate-400 font-bold">Retrieving metadata...</span>
            </div>
          ) : (
            <form onSubmit={handleSaveInfo} className="space-y-6 text-xs font-semibold text-slate-700">
              <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 p-4 border border-slate-200/50 rounded-2xl mb-2">
                <AWSLogo size="xl" className="shadow-md border border-accent-gold" />
                <div className="text-center sm:text-left">
                  <h4 className="text-sm font-bold text-slate-800">Angels World School Emblem</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Official school crest registered in server systems. Scalable high-fidelity JPEG format.</p>
                  <div className="mt-2 inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-accent-red/90 border border-accent-gold/20 text-accent-gold text-[9px] font-bold uppercase tracking-wider">
                    Be Humble • Fly High • Shine Bright
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* School Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">School Name</label>
                  <input
                    type="text"
                    disabled={!isAdmin}
                    value={settings.school_name}
                    onChange={(e) => handleSettingChange('school_name', e.target.value)}
                    className="block w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 disabled:cursor-not-allowed focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-hidden"
                  />
                </div>

                {/* Academic Session */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Active Academic Session</label>
                  <select
                    disabled={!isAdmin}
                    value={settings.active_session}
                    onChange={(e) => handleSettingChange('active_session', e.target.value)}
                    className="block w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 cursor-pointer disabled:cursor-not-allowed focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-hidden text-xs"
                  >
                    <option value="2025-2026">2025-2026</option>
                    <option value="2026-2027">2026-2027</option>
                    <option value="2027-2028">2027-2028</option>
                  </select>
                </div>

                {/* Email address */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Official Email Address</label>
                  <input
                    type="email"
                    disabled={!isAdmin}
                    value={settings.school_email}
                    onChange={(e) => handleSettingChange('school_email', e.target.value)}
                    className="block w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 disabled:cursor-not-allowed focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-hidden"
                  />
                </div>

                {/* Phone No */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Official Contact No.</label>
                  <input
                    type="text"
                    disabled={!isAdmin}
                    value={settings.school_phone}
                    onChange={(e) => handleSettingChange('school_phone', e.target.value)}
                    className="block w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 disabled:cursor-not-allowed focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Address */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Postal Address</label>
                <textarea
                  rows={3}
                  disabled={!isAdmin}
                  value={settings.school_address}
                  onChange={(e) => handleSettingChange('school_address', e.target.value)}
                  className="block w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 disabled:cursor-not-allowed focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-hidden"
                />
              </div>

              {/* Admin Save Action */}
              {isAdmin && (
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 rounded-xl text-xs font-semibold text-white cursor-pointer shadow-md shadow-primary-200 transition-colors disabled:bg-primary-400"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Saving metadata...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
              )}
            </form>
          )}
        </div>

        {/* Security Password credentials panel */}
        <div className="bg-white p-6 border border-slate-100 rounded-3xl shadow-xs hover-card flex flex-col justify-between">
          <div>
            <div className="border-b border-slate-50 pb-3 mb-5">
              <h3 className="font-extrabold text-slate-800 text-sm md:text-base flex items-center gap-2">
                <Lock className="h-4 w-4 text-rose-500" />
                Password & Security
              </h3>
            </div>

            {passError && (
              <div className="bg-rose-50 border-l-2 border-rose-500 p-2.5 rounded-lg text-[10px] font-bold text-rose-700 mb-3">
                {passError}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-3.5 text-xs font-semibold text-slate-700">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Current Password</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="block w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-hidden"
                  placeholder="••••••••"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="block w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-hidden"
                  placeholder="••••••••"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Confirm Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-hidden"
                  placeholder="••••••••"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={passSubmitting}
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 rounded-xl text-xs font-semibold text-white cursor-pointer shadow-md transition-colors disabled:bg-slate-600"
                >
                  {passSubmitting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    'Update Credentials'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
