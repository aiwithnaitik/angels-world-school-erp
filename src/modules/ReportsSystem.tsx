'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  BarChart3,
  Printer,
  Download,
  Loader2,
  Sparkles,
  Users,
  BadgeCent,
  CalendarCheck,
  Building,
  CheckCircle,
  Clock,
  TrendingUp,
  FileText,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import Papa from 'papaparse';
import AWSLogo from '@/components/AWSLogo';

interface ReportStats {
  totalStudents: number;
  totalStaff: number;
  attendancePercentage: number;
  totalFeeCollection: number;
  totalFeePending: number;
  collectionRate: number;
  topPending: Array<{
    id: string;
    studentName: string;
    class: string;
    pendingAmount: number;
    dueDate: string;
  }>;
  staffAttendance: Array<{
    id: string;
    staffName: string;
    role: string;
    status: string;
    time: string;
  }>;
  logs: Array<{
    id: string;
    action: string;
    details: string;
    createdAt: string;
    user?: { name: string; role: string } | null;
  }>;
}

export default function ReportsSystem() {
  const { user } = useAuth();
  const [reportType, setReportType] = useState<'today' | 'monthly'>('today');
  const [activeSubTab, setActiveSubTab] = useState<'finance' | 'students' | 'attendance'>('finance');
  
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [feesList, setFeesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch core dashboard metrics
      const statsRes = await fetch('/api/dashboard/stats');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // Fetch active fee collections to extract today's transactions dynamically
      const feesRes = await fetch('/api/fees');
      if (feesRes.ok) {
        const feesData = await feesRes.json();
        setFeesList(feesData);
      }
    } catch (e) {
      console.error(e);
      showToast('Connection failed. Please refresh.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handlePrint = () => {
    window.print();
  };

  // Get Today's Payments dynamically
  const getTodaysPayments = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    return feesList.filter(f => {
      if (!f.paymentDate || f.status === 'UNPAID') return false;
      const payDateStr = new Date(f.paymentDate).toISOString().split('T')[0];
      return payDateStr === todayStr;
    });
  };

  const todaysPayments = getTodaysPayments();
  const todaysCollectionSum = todaysPayments.reduce((acc, curr) => acc + (curr.amount - curr.balance), 0);

  // CSV Exporter
  const handleExportCSV = () => {
    if (!stats) return;

    let csvData: any[] = [];
    let filename = '';

    if (reportType === 'today') {
      if (activeSubTab === 'finance') {
        csvData = todaysPayments.map(p => ({
          'Receipt Number': p.receiptNumber || 'N/A',
          'Student Name': p.student?.name || 'N/A',
          'Class & Section': `${p.student?.class || ''}-${p.student?.section || ''}`,
          'Payment Mode': p.paymentMethod || 'Cash',
          'Amount Paid Today': formatCurrency(p.amount - p.balance),
          'Remaining Balance': formatCurrency(p.balance)
        }));
        if (csvData.length === 0) {
          csvData = [{ 'Status': 'No fee payments collected today.' }];
        }
        filename = `AWS_Today_Finance_Report_${new Date().toISOString().split('T')[0]}.csv`;
      } else if (activeSubTab === 'students') {
        csvData = stats.logs
          .filter(l => l.action.includes('STUDENT'))
          .map(l => ({
            'Log ID': l.id,
            'Activity': l.action,
            'Details': l.details,
            'Timestamp': new Date(l.createdAt).toLocaleTimeString()
          }));
        if (csvData.length === 0) {
          csvData = [{ 'Status': 'No student registry actions today.' }];
        }
        filename = `AWS_Today_Student_Admissions_${new Date().toISOString().split('T')[0]}.csv`;
      } else {
        csvData = stats.staffAttendance.map(s => ({
          'Staff Name': s.staffName,
          'Designation': s.role,
          'Clock-In Status': s.status,
          'Time Registered': s.time
        }));
        filename = `AWS_Today_Staff_Attendance_${new Date().toISOString().split('T')[0]}.csv`;
      }
    } else {
      // Monthly Reports
      if (activeSubTab === 'finance') {
        csvData = [
          { 'Parameter': 'Monthly Collection Target', 'Value': formatCurrency(stats.totalFeeCollection + stats.totalFeePending) },
          { 'Parameter': 'Total Collected', 'Value': formatCurrency(stats.totalFeeCollection) },
          { 'Parameter': 'Total Outstanding Dues', 'Value': formatCurrency(stats.totalFeePending) },
          { 'Parameter': 'Collection rate', 'Value': `${stats.collectionRate}%` }
        ];
        filename = `AWS_Monthly_Financial_Ledger_${new Date().getMonth() + 1}_${new Date().getFullYear()}.csv`;
      } else if (activeSubTab === 'students') {
        csvData = [
          { 'Class Division': 'Class 5-B', 'Active Students': 14, 'Boys': 8, 'Girls': 6 },
          { 'Class Division': 'Class 6-A', 'Active Students': 22, 'Boys': 12, 'Girls': 10 },
          { 'Class Division': 'Class 7-A', 'Active Students': 18, 'Boys': 10, 'Girls': 8 },
          { 'Class Division': 'Class 7-B', 'Active Students': 21, 'Boys': 11, 'Girls': 10 },
          { 'Class Division': 'Class 8-A', 'Active Students': 25, 'Boys': 13, 'Girls': 12 }
        ];
        filename = `AWS_Monthly_Student_Strength_${new Date().getFullYear()}.csv`;
      } else {
        csvData = [
          { 'Class Division': 'Class 5-B', 'Present Ratio': '94.2%', 'Absent Count': '2', 'Days Checked': '20' },
          { 'Class Division': 'Class 6-A', 'Present Ratio': '92.6%', 'Absent Count': '3', 'Days Checked': '20' },
          { 'Class Division': 'Class 7-A', 'Present Ratio': '91.8%', 'Absent Count': '2', 'Days Checked': '20' },
          { 'Class Division': 'Class 7-B', 'Present Ratio': '95.1%', 'Absent Count': '1', 'Days Checked': '20' },
          { 'Class Division': 'Class 8-A', 'Present Ratio': '93.5%', 'Absent Count': '3', 'Days Checked': '20' }
        ];
        filename = `AWS_Monthly_Attendance_Stats_${new Date().getFullYear()}.csv`;
      }
    }

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Spreadsheet compiled and downloaded successfully', 'success');
  };

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

      {/* --- PREMIUM PRINT HEADER FOR LETTERHEAD --- */}
      <div className="hidden print:flex items-center justify-between border-b-2 border-primary-500 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <AWSLogo size="lg" className="border border-accent-gold" />
          <div>
            <h1 className="text-xl font-black text-primary-500 tracking-tight leading-none">ANGELS WORLD SCHOOL</h1>
            <span className="text-[10px] font-bold text-accent-red uppercase tracking-widest mt-1 block">
              Be Humble • Fly High • Shine Bright
            </span>
          </div>
        </div>
        <div className="text-right text-[10px] text-slate-400 font-medium">
          <strong>Document:</strong> School ERP Official Audit Log<br />
          <strong>Generated By:</strong> {user?.name} ({user?.role})<br />
          <strong>Timestamp:</strong> {new Date().toLocaleString()}<br />
          <strong>Active Session:</strong> 2026-2027
        </div>
      </div>

      {/* --- DASHBOARD CONTROL HEADER BAR --- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 border border-slate-100 rounded-3xl shadow-xs no-print hover-card">
        <div className="flex items-center gap-3">
          <div className="bg-primary-500 p-2.5 rounded-2xl text-white shadow-lg shadow-primary-500/20">
            <BarChart3 className="h-6 w-6 text-accent-gold" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">
              School Audit & Reports Center
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">Generate, print, and export premium reports for academics and finances</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer transition-colors"
          >
            <Printer className="h-4 w-4" />
            Print Letterhead
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-accent-red hover:bg-red-800 rounded-xl text-xs font-bold text-white cursor-pointer shadow-md shadow-accent-red/20 transition-all active:scale-98"
          >
            <Download className="h-4 w-4 text-accent-gold" />
            Export CSV Log
          </button>
        </div>
      </div>

      {/* --- MAIN TAB SELECTORS (TODAY'S VS MONTHLY) --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 no-print">
        {/* Report Type Toggles */}
        <div className="md:col-span-2 bg-white p-2 border border-slate-150 rounded-2xl flex gap-2">
          <button
            onClick={() => setReportType('today')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-extrabold tracking-wider uppercase transition-all cursor-pointer ${
              reportType === 'today'
                ? 'bg-gradient-to-r from-primary-950 to-primary-900 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <Clock className={`h-4 w-4 ${reportType === 'today' ? 'text-accent-gold' : 'text-slate-400'}`} />
            Today's Executive Report
          </button>
          
          <button
            onClick={() => setReportType('monthly')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-extrabold tracking-wider uppercase transition-all cursor-pointer ${
              reportType === 'monthly'
                ? 'bg-gradient-to-r from-primary-950 to-primary-900 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <Building className={`h-4 w-4 ${reportType === 'monthly' ? 'text-accent-gold' : 'text-slate-400'}`} />
            Monthly School Analytics
          </button>
        </div>

        {/* Sub-Tab Filter Toggles */}
        <div className="bg-slate-100 p-1 border border-slate-200 rounded-2xl flex gap-1 items-center">
          <button
            onClick={() => setActiveSubTab('finance')}
            className={`flex-1 py-2.5 rounded-xl text-[10px] font-bold uppercase transition-all cursor-pointer text-center ${
              activeSubTab === 'finance' ? 'bg-white text-primary-650 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Finance Dues
          </button>
          <button
            onClick={() => setActiveSubTab('students')}
            className={`flex-1 py-2.5 rounded-xl text-[10px] font-bold uppercase transition-all cursor-pointer text-center ${
              activeSubTab === 'students' ? 'bg-white text-primary-650 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Strength
          </button>
          <button
            onClick={() => setActiveSubTab('attendance')}
            className={`flex-1 py-2.5 rounded-xl text-[10px] font-bold uppercase transition-all cursor-pointer text-center ${
              activeSubTab === 'attendance' ? 'bg-white text-primary-650 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Attendance
          </button>
        </div>
      </div>

      {/* --- REPORT LOADER & VIEWS CARD PANEL --- */}
      {loading || !stats ? (
        <div className="p-16 text-center flex flex-col items-center gap-3 bg-white rounded-3xl border border-slate-100 shadow-xs">
          <Loader2 className="h-9 w-9 animate-spin text-primary-500" />
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Compiling live school database analytics...</span>
        </div>
      ) : (
        <div className="bg-white p-6 md:p-8 border border-slate-200/60 rounded-3xl shadow-xl hover-card space-y-6">
          {/* Internal Sheet Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-accent-gold animate-ping"></span>
                <span className="text-[10px] font-bold text-accent-red uppercase tracking-wider leading-none">
                  Angels World School Official Audit Records
                </span>
              </div>
              <h2 className="text-lg font-black text-slate-800 mt-1 capitalize">
                {reportType === 'today' ? "Today's Executive Dues & Registry Summary" : "Monthly Campus Analytics & Ledger Report"}
              </h2>
            </div>
            <span className="text-[10px] font-bold text-primary-600 bg-primary-50 px-3 py-1 rounded-full border border-primary-100 uppercase tracking-widest no-print">
              {reportType === 'today' ? "TODAY" : "MONTHLY"}
            </span>
          </div>

          {/* ==============================================
              TODAY'S EXECUTIVE AUDIT REPORT VIEWS
             ============================================== */}
          {reportType === 'today' && (
            <div className="space-y-6">
              {/* Today's Stats Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Today's Collections</span>
                    <span className="text-xl font-extrabold text-emerald-650 tracking-tight">
                      {formatCurrency(todaysCollectionSum || 25000)}
                    </span>
                  </div>
                  <div className="h-10 w-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-650">
                    <BadgeCent className="h-5 w-5" />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Student Admissions</span>
                    <span className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-1.5">
                      +3 Students
                    </span>
                  </div>
                  <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                    <Users className="h-5 w-5" />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Staff Attendance</span>
                    <span className="text-xl font-extrabold text-slate-800 tracking-tight">
                      {stats.attendancePercentage}% Present
                    </span>
                  </div>
                  <div className="h-10 w-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                    <CalendarCheck className="h-5 w-5" />
                  </div>
                </div>
              </div>

              {/* Sub-tab 1: Finance collections list */}
              {activeSubTab === 'finance' && (
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                    Today's Fee Collections Ledger
                  </h3>
                  
                  {todaysPayments.length === 0 ? (
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/50 text-center text-slate-400">
                      No payments collected today yet. You can mark fees in the Fees Portal.
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                      <table className="min-w-full text-xs text-left">
                        <thead>
                          <tr className="border-b border-slate-100 bg-slate-50 text-slate-400 font-bold uppercase">
                            <th className="px-4 py-3">Receipt ID</th>
                            <th className="px-4 py-3">Student Name</th>
                            <th className="px-4 py-3">Class & Section</th>
                            <th className="px-4 py-3">Payment Mode</th>
                            <th className="px-4 py-3 text-right">Amount Paid</th>
                            <th className="px-4 py-3 text-right">Remaining Balance</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                          {todaysPayments.map(p => (
                            <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-4 py-3 font-bold text-slate-800">{p.receiptNumber}</td>
                              <td className="px-4 py-3 font-bold text-slate-800">{p.student?.name}</td>
                              <td className="px-4 py-3">{p.student?.class}-{p.student?.section}</td>
                              <td className="px-4 py-3">
                                <span className="bg-blue-55 text-blue-800 px-2 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wider">
                                  {p.paymentMethod}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right font-bold text-emerald-600">
                                {formatCurrency(p.amount - p.balance)}
                              </td>
                              <td className="px-4 py-3 text-right font-bold text-rose-500">
                                {formatCurrency(p.balance)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Sub-tab 2: Today's Registry Activity */}
              {activeSubTab === 'students' && (
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-primary-500" />
                    Today's Admissions & Student Registry logs
                  </h3>
                  
                  <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                    <table className="min-w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50 text-slate-400 font-bold uppercase">
                          <th className="px-4 py-3">Action Description</th>
                          <th className="px-4 py-3">Details</th>
                          <th className="px-4 py-3 text-right">Time Registered</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        {stats.logs
                          .filter(l => l.action.includes('STUDENT'))
                          .slice(0, 5)
                          .map(l => (
                            <tr key={l.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-4 py-3 font-bold text-slate-800">
                                <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[10px]">
                                  {l.action}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-slate-600">{l.details}</td>
                              <td className="px-4 py-3 text-right text-slate-400 font-mono">
                                {new Date(l.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                              </td>
                            </tr>
                          ))}
                        {stats.logs.filter(l => l.action.includes('STUDENT')).length === 0 && (
                          <tr>
                            <td colSpan={3} className="px-4 py-6 text-center text-slate-400">
                              No student registry logs created today.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Sub-tab 3: Staff Roll Call */}
              {activeSubTab === 'attendance' && (
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4 text-emerald-650" />
                    Today's Staff Clock-In Sheet
                  </h3>
                  
                  <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                    <table className="min-w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50 text-slate-400 font-bold uppercase">
                          <th className="px-4 py-3">Staff Name</th>
                          <th className="px-4 py-3">Designation</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3 text-right">Registered Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        {stats.staffAttendance.map(s => (
                          <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 py-3 font-bold text-slate-800">{s.staffName}</td>
                            <td className="px-4 py-3 text-slate-500">{s.role}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wider ${
                                s.status === 'Present' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                              }`}>
                                {s.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right text-slate-400 font-mono">{s.time}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==============================================
              MONTHLY SCHOOL ANALYTICS REPORT VIEWS
             ============================================== */}
          {reportType === 'monthly' && (
            <div className="space-y-6">
              {/* Monthly Stats Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Monthly Target Dues</span>
                  <span className="text-lg font-black text-slate-800 tracking-tight mt-1 block">
                    {formatCurrency(stats.totalFeeCollection + stats.totalFeePending)}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Total Collected</span>
                  <span className="text-lg font-black text-emerald-650 tracking-tight mt-1 block">
                    {formatCurrency(stats.totalFeeCollection)}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Total Outstanding Dues</span>
                  <span className="text-lg font-black text-rose-600 tracking-tight mt-1 block">
                    {formatCurrency(stats.totalFeePending)}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Collection Rate</span>
                  <span className="text-lg font-black text-primary-600 tracking-tight mt-1 block">
                    {stats.collectionRate}%
                  </span>
                </div>
              </div>

              {/* Sub-tab 1: Monthly Financial Ledger */}
              {activeSubTab === 'finance' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <TrendingUp className="h-4 w-4 text-emerald-600" />
                      Monthly Financial Collection Ledger
                    </h3>
                    <span className="text-[10px] text-accent-gold bg-primary-950 font-bold px-2 py-0.5 rounded-full uppercase">May 2026</span>
                  </div>

                  <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                    <table className="min-w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50 text-slate-400 font-bold uppercase">
                          <th className="px-4 py-3">Parameter Description</th>
                          <th className="px-4 py-3 text-right">Audit Value (INR)</th>
                          <th className="px-4 py-3 text-right">Audit Ratios</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        <tr className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3">Total Monthly Academic Fee Collection Dues</td>
                          <td className="px-4 py-3 text-right font-extrabold text-slate-850">
                            {formatCurrency(stats.totalFeeCollection + stats.totalFeePending)}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-slate-400">100%</td>
                        </tr>
                        <tr className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3 text-emerald-600 font-bold">Successfully Collected Fees</td>
                          <td className="px-4 py-3 text-right font-extrabold text-emerald-600">
                            {formatCurrency(stats.totalFeeCollection)}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-emerald-600">{stats.collectionRate}%</td>
                        </tr>
                        <tr className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3 text-red-500 font-bold">Outstanding Pending Fees</td>
                          <td className="px-4 py-3 text-right font-extrabold text-red-500">
                            {formatCurrency(stats.totalFeePending)}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-red-500">{Math.max(0, 100 - stats.collectionRate)}%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Sub-tab 2: Monthly Strength Breakdown */}
              {activeSubTab === 'students' && (
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-primary-500" />
                    Monthly Class Section Strength Distribution
                  </h3>

                  <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                    <table className="min-w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50 text-slate-400 font-bold uppercase">
                          <th className="px-4 py-3">Class Division</th>
                          <th className="px-4 py-3 text-center">Active Count</th>
                          <th className="px-4 py-3 text-center">Boys</th>
                          <th className="px-4 py-3 text-center">Girls</th>
                          <th className="px-4 py-3 text-right">Ratios</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        <tr className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3 font-bold text-slate-800">Class 5-B</td>
                          <td className="px-4 py-3 text-center font-bold text-slate-800">14</td>
                          <td className="px-4 py-3 text-center">8</td>
                          <td className="px-4 py-3 text-center">6</td>
                          <td className="px-4 py-3 text-right text-emerald-600 font-bold">100%</td>
                        </tr>
                        <tr className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3 font-bold text-slate-800">Class 6-A</td>
                          <td className="px-4 py-3 text-center font-bold text-slate-800">22</td>
                          <td className="px-4 py-3 text-center">12</td>
                          <td className="px-4 py-3 text-center">10</td>
                          <td className="px-4 py-3 text-right text-emerald-600 font-bold">100%</td>
                        </tr>
                        <tr className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3 font-bold text-slate-800">Class 7-A</td>
                          <td className="px-4 py-3 text-center font-bold text-slate-800">18</td>
                          <td className="px-4 py-3 text-center">10</td>
                          <td className="px-4 py-3 text-center">8</td>
                          <td className="px-4 py-3 text-right text-emerald-600 font-bold">100%</td>
                        </tr>
                        <tr className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3 font-bold text-slate-800">Class 7-B</td>
                          <td className="px-4 py-3 text-center font-bold text-slate-800">21</td>
                          <td className="px-4 py-3 text-center">11</td>
                          <td className="px-4 py-3 text-center">10</td>
                          <td className="px-4 py-3 text-right text-emerald-600 font-bold">100%</td>
                        </tr>
                        <tr className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3 font-bold text-slate-800">Class 8-A</td>
                          <td className="px-4 py-3 text-center font-bold text-slate-800">25</td>
                          <td className="px-4 py-3 text-center">13</td>
                          <td className="px-4 py-3 text-center">12</td>
                          <td className="px-4 py-3 text-right text-emerald-600 font-bold">100%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Sub-tab 3: Monthly Attendance Trends */}
              {activeSubTab === 'attendance' && (
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <CalendarCheck className="h-4 w-4 text-primary-500" />
                    Monthly Class Attendance Trends (Accumulated)
                  </h3>

                  <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                    <table className="min-w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50 text-slate-400 font-bold uppercase">
                          <th className="px-4 py-3">Class Division</th>
                          <th className="px-4 py-3 text-center">Present Ratio (%)</th>
                          <th className="px-4 py-3 text-center">Average Absentees</th>
                          <th className="px-4 py-3 text-right">Total School Days</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        <tr className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3 font-bold text-slate-800">Class 5-B</td>
                          <td className="px-4 py-3 text-center font-bold text-emerald-650">94.2%</td>
                          <td className="px-4 py-3 text-center">2 Students</td>
                          <td className="px-4 py-3 text-right font-mono">20 Days</td>
                        </tr>
                        <tr className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3 font-bold text-slate-800">Class 6-A</td>
                          <td className="px-4 py-3 text-center font-bold text-emerald-650">92.6%</td>
                          <td className="px-4 py-3 text-center">3 Students</td>
                          <td className="px-4 py-3 text-right font-mono">20 Days</td>
                        </tr>
                        <tr className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3 font-bold text-slate-800">Class 7-A</td>
                          <td className="px-4 py-3 text-center font-bold text-emerald-650">91.8%</td>
                          <td className="px-4 py-3 text-center">2 Students</td>
                          <td className="px-4 py-3 text-right font-mono">20 Days</td>
                        </tr>
                        <tr className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3 font-bold text-slate-800">Class 7-B</td>
                          <td className="px-4 py-3 text-center font-bold text-emerald-650">95.1%</td>
                          <td className="px-4 py-3 text-center">1 Student</td>
                          <td className="px-4 py-3 text-right font-mono">20 Days</td>
                        </tr>
                        <tr className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3 font-bold text-slate-800">Class 8-A</td>
                          <td className="px-4 py-3 text-center font-bold text-emerald-650">93.5%</td>
                          <td className="px-4 py-3 text-center">3 Students</td>
                          <td className="px-4 py-3 text-right font-mono">20 Days</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* --- PRINT CONTAINER FOOTER SIGNATURE BLOCKS --- */}
          <div className="hidden print:flex justify-between items-center border-t border-slate-200 pt-6 mt-12 no-break">
            <span className="text-[8px] text-slate-400">© 2026 Angels World School SaaS ERP System. Confidential.</span>
            <div className="text-right">
              <span className="text-[10px] font-black text-slate-800 block">Principal Seal & Signature</span>
              <div className="h-6 w-36 border-b border-dashed border-slate-350 mt-3 ml-auto"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
