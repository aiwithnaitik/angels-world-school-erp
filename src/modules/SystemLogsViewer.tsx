'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  History,
  Search,
  Loader2,
  AlertOctagon,
  CheckCircle,
  Database,
  ShieldCheck,
  CalendarDays,
  Sparkles
} from 'lucide-react';

interface SystemLog {
  id: string;
  action: string;
  details: string;
  createdAt: string;
  user: { name: string; role: string } | null;
}

export default function SystemLogsViewer() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const getActionBadgeStyle = (action: string) => {
    if (action.includes('LOGIN')) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (action.includes('DELETE')) return 'bg-rose-100 text-rose-800 border-rose-200';
    if (action.includes('CREATE')) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (action.includes('COLLECT')) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    return 'bg-slate-100 text-slate-800 border-slate-200';
  };

  const filteredLogs = logs.filter(l =>
    l.action.toLowerCase().includes(search.toLowerCase()) ||
    l.details.toLowerCase().includes(search.toLowerCase()) ||
    (l.user?.name && l.user.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 border border-slate-100 rounded-3xl shadow-xs">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <History className="h-6 w-6 text-primary-500" />
            System Audit Trail
          </h1>
          <p className="text-xs text-slate-500 mt-1">Audit real-time school operations, session credentials, and collection logs</p>
        </div>
      </div>

      {/* Search Filter */}
      <div className="bg-white p-4 border border-slate-100 rounded-2xl shadow-xs">
        <div className="relative w-full md:w-80 shadow-xs">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Search by Action or details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-primary-500 focus:bg-white text-xs transition-all"
          />
        </div>
      </div>

      {/* Database logs Table */}
      <div className="bg-white border border-slate-100 rounded-3xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
            <span className="text-xs text-slate-400 font-bold">Retrieving audit ledger...</span>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-16 text-center text-slate-400 flex flex-col items-center gap-3">
            <Database className="h-10 w-10 text-slate-300" />
            <div>
              <h3 className="font-bold text-slate-700 text-sm">No Audit Logs</h3>
              <p className="text-xs text-slate-400 mt-1">Audit trail ledger is currently empty</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Action Code</th>
                  <th className="px-6 py-4">Logged Details</th>
                  <th className="px-6 py-4">Date & Time</th>
                  <th className="px-6 py-4">User Initiator</th>
                  <th className="px-6 py-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 border rounded-lg font-bold text-[9px] uppercase tracking-wider ${getActionBadgeStyle(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800 max-w-sm truncate" title={log.details}>
                      {log.details}
                    </td>
                    <td className="px-6 py-4 text-slate-400 font-mono">
                      {new Date(log.createdAt).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4">
                      {log.user ? (
                        <div>
                          <span className="font-extrabold text-slate-700 block">{log.user.name}</span>
                          <span className="text-[9px] text-slate-400 capitalize">{log.user.role.toLowerCase()}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Automated System</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Audited
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
