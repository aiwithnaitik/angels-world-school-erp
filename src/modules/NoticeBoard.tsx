'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  BellRing,
  Search,
  Filter,
  PlusCircle,
  Loader2,
  CalendarDays,
  UserCheck,
  Megaphone,
  Volume2
} from 'lucide-react';

interface Notice {
  id: string;
  title: string;
  content: string;
  category: 'General' | 'Event' | 'Holiday' | 'Examination';
  author: string;
  createdAt: string;
}

export default function NoticeBoard() {
  const { user } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Modal Control
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<'General' | 'Event' | 'Holiday' | 'Examination'>('General');
  const [submitting, setSubmitting] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadNotices = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/notices');
      if (res.ok) {
        const data = await res.json();
        setNotices(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotices();
  }, []);

  const handlePublishSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/notices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          category,
          author: user?.name || 'School Administration'
        })
      });

      if (res.ok) {
        showToast('Notice published successfully to system boards', 'success');
        setModalOpen(false);
        setTitle('');
        setContent('');
        setCategory('General');
        loadNotices();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to publish notice', 'error');
      }
    } catch (err) {
      showToast('Connection failure', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'Event': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Holiday': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Examination': return 'bg-rose-100 text-rose-800 border-rose-200';
      default: return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
  };

  const filteredNotices = notices.filter(n => {
    const matchesSearch = n.title.toLowerCase().includes(search.toLowerCase()) || n.content.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter ? n.category === categoryFilter : true;
    return matchesSearch && matchesCategory;
  });

  const hasWriteAccess = user?.role === 'ADMIN' || user?.role === 'TEACHER';

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
            <BellRing className="h-6 w-6 text-primary-500" />
            School Notice Board
          </h1>
          <p className="text-xs text-slate-500 mt-1">Read general updates, examination dates, events, and holiday notices</p>
        </div>
        
        {hasWriteAccess && (
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 rounded-xl text-xs font-semibold text-white cursor-pointer shadow-md shadow-primary-200 transition-colors"
          >
            <PlusCircle className="h-4 w-4" />
            Publish Notice
          </button>
        )}
      </div>

      {/* Filters bar */}
      <div className="bg-white p-4 border border-slate-100 rounded-2xl shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80 shadow-xs">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Search notices title or content..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-primary-500 focus:bg-white text-xs transition-all"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto shrink-0 justify-end">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1 text-slate-500">
            <Filter className="h-3.5 w-3.5" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 outline-hidden cursor-pointer"
            >
              <option value="">All Categories</option>
              <option value="General">General</option>
              <option value="Event">Event</option>
              <option value="Holiday">Holiday</option>
              <option value="Examination">Examination</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notices Grid cards */}
      {loading ? (
        <div className="p-12 text-center bg-white border border-slate-100 rounded-3xl flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          <span className="text-xs text-slate-400 font-bold">Refreshing notice boards...</span>
        </div>
      ) : filteredNotices.length === 0 ? (
        <div className="p-16 text-center bg-white border border-slate-100 rounded-3xl text-slate-400 flex flex-col items-center gap-3">
          <Volume2 className="h-10 w-10 text-slate-300" />
          <div>
            <h3 className="font-bold text-slate-700 text-sm">Notice Board is Empty</h3>
            <p className="text-xs text-slate-400 mt-1">There are no updates published in this section</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredNotices.map((notice) => (
            <div key={notice.id} className="bg-white p-6 border border-slate-100 rounded-3xl shadow-xs hover-card flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-start gap-2">
                  <span className={`px-2.5 py-0.5 border rounded-lg font-bold text-[9px] uppercase tracking-wider ${getCategoryColor(notice.category)}`}>
                    {notice.category}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5 font-bold">
                    <CalendarDays className="h-3.5 w-3.5 text-slate-300" />
                    {new Date(notice.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <h3 className="font-extrabold text-slate-800 text-sm md:text-base leading-tight hover:text-primary-600 cursor-pointer">{notice.title}</h3>
                <p className="text-slate-500 font-semibold text-xs leading-relaxed pt-1">{notice.content}</p>
              </div>

              <div className="border-t border-slate-50 pt-3 flex justify-between items-center text-[10px] text-slate-400 font-bold">
                <span className="flex items-center gap-1">
                  <UserCheck className="h-3.5 w-3.5 text-primary-500" />
                  Published by: {notice.author}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- PUBLISH NOTICE MODAL DIALOG --- */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-100 w-full max-w-md rounded-3xl shadow-2xl flex flex-col animate-slide-in">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h3 className="font-extrabold text-slate-800 text-sm md:text-base flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-primary-500" />
                Publish System Notice
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold p-1">✕</button>
            </div>
            
            <form onSubmit={handlePublishSubmit} className="p-6 space-y-4 text-xs font-semibold text-slate-700">
              {/* Notice Title */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Notice Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="block w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-hidden"
                  placeholder="e.g. Summer Vacation details..."
                />
              </div>

              {/* Category */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Board Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="block w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 cursor-pointer focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-hidden text-xs"
                >
                  <option value="General">General</option>
                  <option value="Event">School Event</option>
                  <option value="Holiday">Vacation / Holiday</option>
                  <option value="Examination">Examination Details</option>
                </select>
              </div>

              {/* Content Body */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Notice Message Content</label>
                <textarea
                  required
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="block w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-hidden"
                  placeholder="e.g. School will remain closed from..."
                />
              </div>

              {/* Modal Footer Actions */}
              <div className="flex gap-2 justify-end border-t border-slate-100 pt-4 shrink-0">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-1.5 px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-xl text-xs font-semibold text-white shadow-md cursor-pointer disabled:bg-primary-400"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    'Publish Notice'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
