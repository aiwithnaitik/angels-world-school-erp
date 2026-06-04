'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  Users,
  UserCheck,
  CalendarCheck,
  Building,
  CircleDollarSign,
  TrendingUp,
  PlusCircle,
  FileCheck2,
  BadgeCent,
  ClipboardList,
  CalendarDays,
  PlusSquare,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowRight,
  TrendingDown,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import AWSLogo from '@/components/AWSLogo';

interface DashboardStats {
  totalStudents: number;
  totalStaff: number;
  attendancePercentage: number;
  totalClasses: number;
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

export default function DashboardView() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/dashboard/stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error('Failed to load dashboard metrics', err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-pulse flex flex-col items-center gap-2">
          <div className="h-8 w-8 rounded-full border-4 border-primary-500 border-t-transparent animate-spin"></div>
          <span className="text-sm font-semibold text-slate-500">Loading Dashboard Metrics...</span>
        </div>
      </div>
    );
  }

  const role = user?.role || 'STAFF';

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gradient-to-r from-primary-950 via-primary-900 to-slate-950 p-6 border border-primary-500/20 rounded-3xl shadow-lg shadow-primary-950/10 gap-4 relative overflow-hidden text-white">
        <div className="absolute right-0 top-0 w-64 h-64 bg-accent-gold rounded-full filter blur-3xl opacity-5 -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute left-1/3 bottom-0 w-48 h-48 bg-accent-red rounded-full filter blur-3xl opacity-10 translate-y-1/2"></div>
        
        <div className="flex items-center gap-4 relative z-10">
          <AWSLogo size="lg" className="border border-accent-gold/40 shadow-lg" />
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight flex items-center gap-2 text-white">
              Welcome Back, {user?.name}!
              <Sparkles className="h-5 w-5 text-accent-gold animate-pulse" />
            </h1>
            <div className="flex flex-wrap gap-2 items-center mt-1.5">
              <span className="text-[10px] bg-accent-red border border-accent-gold/20 font-bold px-2.5 py-0.5 rounded-full text-white uppercase tracking-wider">
                {role}
              </span>
              <span className="text-xs text-slate-300 font-medium">
                Angels World School SaaS Management Dashboard
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-1.5 relative z-10 shrink-0 text-right w-full md:w-auto mt-2 md:mt-0 border-t border-slate-750/50 md:border-0 pt-3 md:pt-0">
          <span className="text-[10px] font-bold text-accent-gold tracking-widest uppercase bg-primary-950/60 border border-primary-800/30 px-3 py-1 rounded-full">
            Be Humble • Fly High • Shine Bright
          </span>
          <span className="text-[10px] text-slate-400 font-medium">
            Session: 2026-2027 • {new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* --- STATS COUNTERS PANEL --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Total Students */}
        <div className="bg-white p-5 border border-slate-100 rounded-3xl shadow-xs flex items-center justify-between hover-card">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Students</span>
            <div className="text-2xl font-extrabold text-slate-800">{stats.totalStudents}</div>
            <span className="text-[10px] text-primary-500 font-semibold flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> +18 this month
            </span>
          </div>
          <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
            <Users className="h-5 w-5" />
          </div>
        </div>

        {/* Card 2: Total Staff */}
        <div className="bg-white p-5 border border-slate-100 rounded-3xl shadow-xs flex items-center justify-between hover-card">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Staff</span>
            <div className="text-2xl font-extrabold text-slate-800">{stats.totalStaff}</div>
            <span className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> +4 this month
            </span>
          </div>
          <div className="h-12 w-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
            <UserCheck className="h-5 w-5" />
          </div>
        </div>

        {/* Card 3: Attendance Today */}
        <div className="bg-white p-5 border border-slate-100 rounded-3xl shadow-xs flex items-center justify-between hover-card">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Attendance Today</span>
            <div className="text-2xl font-extrabold text-slate-800">{stats.attendancePercentage}%</div>
            <Link href="/dashboard/attendance" className="text-[10px] text-primary-600 hover:text-primary-800 font-bold block transition-colors">
              View Details →
            </Link>
          </div>
          <div className="h-12 w-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
            <CalendarCheck className="h-5 w-5" />
          </div>
        </div>

        {/* Card 4: Total Classes */}
        <div className="bg-white p-5 border border-slate-100 rounded-3xl shadow-xs flex items-center justify-between hover-card">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Classes</span>
            <div className="text-2xl font-extrabold text-slate-800">{stats.totalClasses}</div>
            <span className="text-[10px] text-slate-400 block font-medium">42 active sections</span>
          </div>
          <div className="h-12 w-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
            <Building className="h-5 w-5" />
          </div>
        </div>

        {/* Card 5: Total Fee Collection */}
        <div className="bg-white p-5 border border-slate-100 rounded-3xl shadow-xs flex items-center justify-between hover-card">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Monthly Fees</span>
            <div className="text-2xl font-extrabold text-slate-800 truncate max-w-[130px]">{formatCurrency(stats.totalFeeCollection)}</div>
            <span className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> +12.6% this month
            </span>
          </div>
          <div className="h-12 w-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
            <CircleDollarSign className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* --- MIDDLE ROW: GRAPH AND RECENT NOTICES --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Trend Line Chart */}
        <div className="lg:col-span-2 bg-white p-6 border border-slate-100 rounded-3xl shadow-xs hover-card flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-50 pb-3 mb-4">
            <h3 className="font-extrabold text-slate-800 text-sm md:text-base">
              Attendance Overview (This Week)
            </h3>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full">Weekly Trend</span>
          </div>
          
          {/* Custom SVG Line Chart - 100% lightweight & React 19 responsive */}
          <div className="relative h-64 w-full flex items-end pt-4 pb-2">
            <svg viewBox="0 0 600 200" className="w-full h-full overflow-visible">
              {/* Grid Lines */}
              <line x1="0" y1="0" x2="600" y2="0" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="50" x2="600" y2="50" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="100" x2="600" y2="100" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="150" x2="600" y2="150" stroke="#f1f5f9" strokeWidth="1" />
              
              {/* Y Axis Legend */}
              <text x="-10" y="5" className="text-[9px] font-semibold fill-slate-400 text-anchor-end">100%</text>
              <text x="-10" y="55" className="text-[9px] font-semibold fill-slate-400 text-anchor-end">75%</text>
              <text x="-10" y="105" className="text-[9px] font-semibold fill-slate-400 text-anchor-end">50%</text>
              <text x="-10" y="155" className="text-[9px] font-semibold fill-slate-400 text-anchor-end">25%</text>
              <text x="-10" y="200" className="text-[9px] font-semibold fill-slate-400 text-anchor-end">0%</text>

              {/* Chart Line Path */}
              {/* Coordinates correspond to days: Mon(88%), Tue(91%), Wed(93%), Thu(87%), Fri(92%), Sat(86%) */}
              <path
                d="M 50,24 L 150,18 L 250,14 L 350,26 L 450,16 L 550,28"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              
              {/* Chart Gradient Area */}
              <path
                d="M 50,24 L 150,18 L 250,14 L 350,26 L 450,16 L 550,28 L 550,200 L 50,200 Z"
                fill="url(#attendanceGradient)"
                opacity="0.15"
              />
              
              {/* Data points */}
              <circle cx="50" cy="24" r="5" fill="#3b82f6" stroke="white" strokeWidth="2" />
              <circle cx="150" cy="18" r="5" fill="#3b82f6" stroke="white" strokeWidth="2" />
              <circle cx="250" cy="14" r="5" fill="#3b82f6" stroke="white" strokeWidth="2" />
              <circle cx="350" cy="26" r="5" fill="#3b82f6" stroke="white" strokeWidth="2" />
              <circle cx="450" cy="16" r="5" fill="#3b82f6" stroke="white" strokeWidth="2" />
              <circle cx="550" cy="28" r="5" fill="#3b82f6" stroke="white" strokeWidth="2" />

              {/* Data labels */}
              <text x="50" y="12" className="text-[9px] font-bold fill-slate-600 text-anchor-middle">88%</text>
              <text x="150" y="6" className="text-[9px] font-bold fill-slate-600 text-anchor-middle">91%</text>
              <text x="250" y="2" className="text-[9px] font-bold fill-slate-600 text-anchor-middle">93%</text>
              <text x="350" y="14" className="text-[9px] font-bold fill-slate-600 text-anchor-middle">87%</text>
              <text x="450" y="4" className="text-[9px] font-bold fill-slate-600 text-anchor-middle">92%</text>
              <text x="550" y="16" className="text-[9px] font-bold fill-slate-600 text-anchor-middle">86%</text>

              {/* X Axis Labels */}
              <text x="50" y="220" className="text-[10px] font-semibold fill-slate-400 text-anchor-middle">Mon</text>
              <text x="150" y="220" className="text-[10px] font-semibold fill-slate-400 text-anchor-middle">Tue</text>
              <text x="250" y="220" className="text-[10px] font-semibold fill-slate-400 text-anchor-middle">Wed</text>
              <text x="350" y="220" className="text-[10px] font-semibold fill-slate-400 text-anchor-middle">Thu</text>
              <text x="450" y="220" className="text-[10px] font-semibold fill-slate-400 text-anchor-middle">Fri</text>
              <text x="550" y="220" className="text-[10px] font-semibold fill-slate-400 text-anchor-middle">Sat</text>

              {/* Definitions for Gradients */}
              <defs>
                <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Recent Notices */}
        <div className="bg-white p-6 border border-slate-100 rounded-3xl shadow-xs hover-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-50 pb-3 mb-4">
              <h3 className="font-extrabold text-slate-800 text-sm md:text-base">
                Recent Notices
              </h3>
              <Link href="/dashboard/notices" className="text-xs text-primary-600 font-bold hover:text-primary-800">
                View All
              </Link>
            </div>
            
            <div className="space-y-4">
              <div className="flex gap-3 items-start border-b border-slate-50 pb-3">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600 mt-0.5">
                  <CalendarDays className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 hover:text-primary-600 cursor-pointer">Annual Day Celebration</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">Annual Day will be celebrated on 20th July 2026. Performance reports will be shared...</p>
                  <span className="text-[9px] text-slate-400 block mt-1">May 20, 2026</span>
                </div>
              </div>
              <div className="flex gap-3 items-start border-b border-slate-50 pb-3">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600 mt-0.5">
                  <ClipboardList className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 hover:text-primary-600 cursor-pointer">Parent-Teacher Meeting</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">PTM is scheduled on 25th May 2026. Timings: 9:00 AM to 1:00 PM...</p>
                  <span className="text-[9px] text-slate-400 block mt-1">May 18, 2026</span>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <div className="p-2 rounded-xl bg-purple-50 text-purple-600 mt-0.5">
                  <PlusSquare className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 hover:text-primary-600 cursor-pointer">Summer Vacation</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">School will remain closed from 1st June to 30th June for summer vacations...</p>
                  <span className="text-[9px] text-slate-400 block mt-1">May 15, 2026</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- THIRD ROW: QUICK LINKS, PIE CHART, FEE OVERVIEW --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Links Grid */}
        <div className="bg-white p-6 border border-slate-100 rounded-3xl shadow-xs hover-card flex flex-col justify-between">
          <div className="border-b border-slate-50 pb-3 mb-4">
            <h3 className="font-extrabold text-slate-800 text-sm">Quick Links</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <Link href="/dashboard/students?action=add" className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-100 rounded-2xl gap-2 cursor-pointer transition-all group">
              <PlusCircle className="h-5 w-5 text-blue-600 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-slate-700">Add Student</span>
            </Link>
            <Link href="/dashboard/staff-records" className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-emerald-50 border border-slate-100 hover:border-emerald-100 rounded-2xl gap-2 cursor-pointer transition-all group">
              <PlusCircle className="h-5 w-5 text-emerald-600 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-slate-700">Add Staff</span>
            </Link>
            <Link href="/dashboard/attendance" className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-amber-50 border border-slate-100 hover:border-amber-100 rounded-2xl gap-2 cursor-pointer transition-all group">
              <FileCheck2 className="h-5 w-5 text-amber-600 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-slate-700">Mark Attendance</span>
            </Link>
            <Link href="/dashboard/fees" className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-emerald-50 border border-slate-100 hover:border-emerald-100 rounded-2xl gap-2 cursor-pointer transition-all group">
              <BadgeCent className="h-5 w-5 text-emerald-600 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-slate-700">Fee Collection</span>
            </Link>
            <Link href="/dashboard/notices" className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-purple-50 border border-slate-100 hover:border-purple-100 rounded-2xl gap-2 cursor-pointer transition-all group">
              <PlusSquare className="h-5 w-5 text-purple-600 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-slate-700">Add Notice</span>
            </Link>
            <Link href="#" className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-rose-50 border border-slate-100 hover:border-rose-100 rounded-2xl gap-2 cursor-pointer transition-all group">
              <CalendarDays className="h-5 w-5 text-rose-600 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-slate-700">Create Event</span>
            </Link>
          </div>
        </div>

        {/* Student Attendance Status Pie */}
        <div className="bg-white p-6 border border-slate-100 rounded-3xl shadow-xs hover-card flex flex-col justify-between">
          <div className="border-b border-slate-50 pb-3 mb-4">
            <h3 className="font-extrabold text-slate-800 text-sm">Student Attendance Status</h3>
          </div>
          
          <div className="flex flex-col items-center justify-center py-2">
            <div className="relative h-40 w-40 flex items-center justify-center">
              {/* Custom SVG Circle Donut Chart */}
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                {/* Background Track */}
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f1f5f9" strokeWidth="12" />
                {/* Present slice - 93.2% */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="#10b981"
                  strokeWidth="12"
                  strokeDasharray="234.2 251.2" // 93.2% of circumference (2 * pi * r = 251.2)
                  strokeLinecap="round"
                />
                {/* Absent slice - 6.8% */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="#ef4444"
                  strokeWidth="12"
                  strokeDasharray="17 251.2"
                  strokeDashoffset="-234.2"
                  strokeLinecap="round"
                />
              </svg>
              {/* Inner Donut Text */}
              <div className="absolute flex flex-col items-center text-center">
                <span className="text-2xl font-black text-slate-800 leading-none">93.2%</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase mt-1">Present</span>
              </div>
            </div>

            <div className="flex gap-6 mt-4 justify-center w-full">
              <div className="flex items-center gap-2">
                <span className="block h-3 w-3 bg-emerald-500 rounded-sm shrink-0"></span>
                <span className="text-xs text-slate-600 font-semibold">Present (1,162)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="block h-3 w-3 bg-red-500 rounded-sm shrink-0"></span>
                <span className="text-xs text-slate-600 font-semibold">Absent (86)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Fee Collection Overview */}
        <div className="bg-white p-6 border border-slate-100 rounded-3xl shadow-xs hover-card flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-50 pb-3 mb-4">
            <h3 className="font-extrabold text-slate-800 text-sm">Fee Collection Overview</h3>
            <Link href="/dashboard/reports" className="text-xs text-primary-600 font-bold hover:text-primary-800">
              View Report
            </Link>
          </div>
          
          <div className="space-y-4 py-2">
            <div className="flex justify-between items-center text-sm border-b border-slate-50 pb-2">
              <span className="text-slate-500 font-medium">Total Collected</span>
              <span className="font-extrabold text-emerald-600">{formatCurrency(stats.totalFeeCollection)}</span>
            </div>
            <div className="flex justify-between items-center text-sm border-b border-slate-50 pb-2">
              <span className="text-slate-500 font-medium">Total Pending</span>
              <span className="font-extrabold text-red-500">{formatCurrency(stats.totalFeePending)}</span>
            </div>
            <div className="flex justify-between items-center text-sm border-b border-slate-50 pb-2">
              <span className="text-slate-500 font-medium">Total Students</span>
              <span className="font-extrabold text-slate-800">{stats.totalStudents}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 font-medium">Collection Rate</span>
              <span className="font-extrabold text-primary-600">{stats.collectionRate}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* --- FOURTH ROW: DATA TABLES --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 Fee Pending Students */}
        <div className="bg-white p-6 border border-slate-100 rounded-3xl shadow-xs hover-card">
          <div className="border-b border-slate-50 pb-3 mb-4 flex justify-between items-center">
            <h3 className="font-extrabold text-slate-800 text-sm md:text-base">
              Top 5 Fee Pending Students
            </h3>
            <span className="text-[10px] text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full font-bold">Alert</span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-2.5">Student Name</th>
                  <th className="py-2.5">Class</th>
                  <th className="py-2.5">Pending Amount</th>
                  <th className="py-2.5">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-medium text-slate-700">
                {stats.topPending.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 font-bold text-slate-800">{item.studentName}</td>
                    <td className="py-3">{item.class}</td>
                    <td className="py-3 text-red-600 font-bold">{formatCurrency(item.pendingAmount)}</td>
                    <td className="py-3 text-slate-400">{item.dueDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Today's Staff Attendance */}
        <div className="bg-white p-6 border border-slate-100 rounded-3xl shadow-xs hover-card">
          <div className="border-b border-slate-50 pb-3 mb-4 flex justify-between items-center">
            <h3 className="font-extrabold text-slate-800 text-sm md:text-base">
              Today's Staff Attendance
            </h3>
            <Link href="/dashboard/staff-records" className="text-xs text-primary-600 font-bold hover:text-primary-800">
              View All
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-2.5">Staff Name</th>
                  <th className="py-2.5">Role</th>
                  <th className="py-2.5">Status</th>
                  <th className="py-2.5">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-medium text-slate-700">
                {stats.staffAttendance.map((staff) => (
                  <tr key={staff.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 font-bold text-slate-800">{staff.staffName}</td>
                    <td className="py-3 text-slate-500">{staff.role}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        staff.status === 'Present' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {staff.status}
                      </span>
                    </td>
                    <td className="py-3 text-slate-400">{staff.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
