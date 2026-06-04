'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  CalendarDays,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Users,
  Award,
  CalendarRange,
  ClipboardList
} from 'lucide-react';

interface AttendanceRecord {
  studentId: string;
  studentName: string;
  admissionNumber: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE';
  marked: boolean;
}

const CLASS_SECTION_MAP: Record<string, string[]> = {
  'Pre Nursery': ['A'],
  'Nursery': ['A'],
  'LKG': ['A', 'B'],
  'UKG': ['A', 'B'],
  'Class 1': ['A', 'B'],
  'Class 2': ['A', 'B'],
  'Class 3': ['A', 'B'],
  'Class 4': ['A', 'B'],
  'Class 5': ['A', 'B'],
  'Class 6': ['A', 'B'],
  'Class 7': ['A'],
  'Class 8': ['A'],
  'Class 9': ['A', 'B'],
  'Class 10': ['A']
};

export default function AttendanceSystem() {
  const { user } = useAuth();
  
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClass, setSelectedClass] = useState('Class 7');
  const [selectedSection, setSelectedSection] = useState('A');
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Stats
  const [stats, setStats] = useState({
    present: 0,
    absent: 0,
    late: 0,
    total: 0
  });

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Load roll sheet
  const handleLoadSheet = async () => {
    setLoading(true);
    setRecords([]);
    try {
      const qParams = new URLSearchParams({
        date,
        class: selectedClass,
        section: selectedSection
      });

      const res = await fetch(`/api/attendance?${qParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setRecords(data.records);
        computeStats(data.records);
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to load attendance roll sheet', 'error');
      }
    } catch (e) {
      showToast('Connection error', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Load sheet on initial select change or manual trigger
  useEffect(() => {
    handleLoadSheet();
  }, [date, selectedClass, selectedSection]);

  const computeStats = (items: AttendanceRecord[]) => {
    let p = 0, a = 0, l = 0;
    items.forEach(item => {
      if (item.status === 'PRESENT') p++;
      else if (item.status === 'ABSENT') a++;
      else if (item.status === 'LATE') l++;
    });
    setStats({ present: p, absent: a, late: l, total: items.length });
  };

  // Toggle status for a student
  const handleStatusChange = (studentId: string, newStatus: 'PRESENT' | 'ABSENT' | 'LATE') => {
    const updated = records.map(item => {
      if (item.studentId === studentId) {
        return { ...item, status: newStatus };
      }
      return item;
    });
    setRecords(updated);
    computeStats(updated);
  };

  // Bulk toggles
  const handleToggleAll = (status: 'PRESENT' | 'ABSENT') => {
    if (records.length === 0) return;
    const updated = records.map(item => ({ ...item, status }));
    setRecords(updated);
    computeStats(updated);
    showToast(`All students toggled to "${status.toLowerCase()}" status`, 'info');
  };

  // Save Attendance Sheet
  const handleSaveAttendance = async () => {
    if (records.length === 0) {
      showToast('No students registered on the active sheet', 'error');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          class: selectedClass,
          section: selectedSection,
          records: records.map(r => ({
            studentId: r.studentId,
            status: r.status
          }))
        })
      });

      if (res.ok) {
        showToast('Daily roll sheet registered successfully', 'success');
        handleLoadSheet();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to save attendance logs', 'error');
      }
    } catch (e) {
      showToast('Connection failed during registration', 'error');
    } finally {
      setSaving(false);
    }
  };

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

      {/* Main Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 border border-slate-100 rounded-3xl shadow-xs">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-primary-500" />
            Daily Attendance Tracker
          </h1>
          <p className="text-xs text-slate-500 mt-1">Mark and monitor classroom attendance lists and ratios</p>
        </div>
      </div>

      {/* Selection Control Panel */}
      <div className="bg-white p-5 border border-slate-100 rounded-2xl shadow-xs flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Class select */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Target Class</span>
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-500">
              <select
                value={selectedClass}
                onChange={(e) => {
                  const newClass = e.target.value;
                  const allowedSections = CLASS_SECTION_MAP[newClass] || ['Single'];
                  setSelectedClass(newClass);
                  setSelectedSection(allowedSections.includes(selectedSection) ? selectedSection : allowedSections[0]);
                }}
                className="bg-transparent text-xs font-semibold text-slate-700 outline-hidden cursor-pointer"
              >
                {Object.keys(CLASS_SECTION_MAP).map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Section select */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Section</span>
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-500">
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-700 outline-hidden cursor-pointer"
              >
                {(CLASS_SECTION_MAP[selectedClass] || ['Single']).map(sec => (
                  <option key={sec} value={sec}>{sec}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Date Selector */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Roll-Call Date</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 rounded-xl outline-hidden cursor-pointer focus:bg-white focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Attendance dynamic stats counters */}
        <div className="flex gap-4 shrink-0 mt-2 sm:mt-0">
          <div className="text-center bg-emerald-50/75 border border-emerald-100 rounded-xl px-3 py-1.5">
            <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider block">Present</span>
            <span className="text-base font-extrabold text-emerald-700 leading-none">{stats.present}</span>
          </div>
          <div className="text-center bg-rose-50/75 border border-rose-100 rounded-xl px-3 py-1.5">
            <span className="text-[9px] font-bold text-rose-500 uppercase tracking-wider block">Absent</span>
            <span className="text-base font-extrabold text-rose-700 leading-none">{stats.absent}</span>
          </div>
          <div className="text-center bg-amber-50/75 border border-amber-100 rounded-xl px-3 py-1.5">
            <span className="text-[9px] font-bold text-amber-500 uppercase tracking-wider block">Late</span>
            <span className="text-base font-extrabold text-amber-700 leading-none">{stats.late}</span>
          </div>
          <div className="text-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Total Class</span>
            <span className="text-base font-extrabold text-slate-700 leading-none">{stats.total}</span>
          </div>
        </div>
      </div>

      {/* Roll Sheet Grid Table */}
      <div className="bg-white border border-slate-100 rounded-3xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
            <span className="text-xs text-slate-400 font-bold">Compiling classroom roll sheet...</span>
          </div>
        ) : records.length === 0 ? (
          <div className="p-16 text-center text-slate-400 flex flex-col items-center gap-3">
            <Users className="h-10 w-10 text-slate-300" />
            <div>
              <h3 className="font-bold text-slate-700 text-sm">No Active Students</h3>
              <p className="text-xs text-slate-400 mt-1">There are no active students in {selectedClass}-{selectedSection}</p>
            </div>
          </div>
        ) : (
          <div>
            {/* Quick Toggle Helper Tools */}
            {hasWriteAccess && (
              <div className="bg-slate-50 border-b border-slate-100 px-6 py-3 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-500">Roll-call helper tools:</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggleAll('PRESENT')}
                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 rounded-lg text-emerald-700 font-bold cursor-pointer transition-colors"
                  >
                    Mark All Present
                  </button>
                  <button
                    onClick={() => handleToggleAll('ABSENT')}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-100 rounded-lg text-rose-700 font-bold cursor-pointer transition-colors"
                  >
                    Mark All Absent
                  </button>
                </div>
              </div>
            )}

            {/* Roll Call Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="px-6 py-4">Student</th>
                    <th className="px-6 py-4">Admission Number</th>
                    <th className="px-6 py-4">Class Division</th>
                    <th className="px-6 py-4 text-center">Attendance Status Roll-Call</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                  {records.map((item) => (
                    <tr key={item.studentId} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 bg-slate-100 rounded-full flex items-center justify-center font-bold text-primary-600 border border-slate-200">
                            {item.studentName.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-extrabold text-slate-800 block">{item.studentName}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-800 font-mono">
                        {item.admissionNumber}
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-slate-100 border border-slate-200/50 px-2 py-0.5 rounded-md font-semibold text-slate-500">
                          {selectedClass}-{selectedSection}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          {/* Interactive present/absent selector buttons */}
                          <div className="flex bg-slate-100 p-1 border border-slate-200 rounded-xl gap-1 shrink-0">
                            <button
                              disabled={!hasWriteAccess}
                              onClick={() => handleStatusChange(item.studentId, 'PRESENT')}
                              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer ${
                                item.status === 'PRESENT'
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'text-slate-500 hover:bg-white hover:text-slate-700 disabled:hover:bg-transparent'
                              }`}
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              Present
                            </button>
                            <button
                              disabled={!hasWriteAccess}
                              onClick={() => handleStatusChange(item.studentId, 'ABSENT')}
                              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer ${
                                item.status === 'ABSENT'
                                  ? 'bg-rose-600 text-white shadow-xs'
                                  : 'text-slate-500 hover:bg-white hover:text-slate-700 disabled:hover:bg-transparent'
                              }`}
                            >
                              <XCircle className="h-3 w-3" />
                              Absent
                            </button>
                            <button
                              disabled={!hasWriteAccess}
                              onClick={() => handleStatusChange(item.studentId, 'LATE')}
                              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer ${
                                item.status === 'LATE'
                                  ? 'bg-amber-500 text-white shadow-xs'
                                  : 'text-slate-500 hover:bg-white hover:text-slate-700 disabled:hover:bg-transparent'
                              }`}
                            >
                              <Clock className="h-3 w-3" />
                              Late
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bottom Actions footer */}
            {hasWriteAccess && (
              <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex justify-end shrink-0">
                <button
                  onClick={handleSaveAttendance}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 rounded-xl text-xs font-semibold text-white cursor-pointer shadow-md shadow-primary-200 transition-colors disabled:bg-primary-400"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Registering roll sheet...
                    </>
                  ) : (
                    'Submit Attendance'
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
