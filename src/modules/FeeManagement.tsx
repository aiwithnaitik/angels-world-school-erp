'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  CreditCard,
  Search,
  Filter,
  DollarSign,
  Calendar,
  AlertCircle,
  FileCheck2,
  BadgeCent,
  Loader2,
  Printer,
  ChevronRight,
  TrendingUp,
  Sparkles,
  ClipboardList,
  PlusCircle,
  UserPlus
} from 'lucide-react';
import jsPDF from 'jspdf';

interface Student {
  id: string;
  admissionNumber: string;
  name: string;
  class: string;
  section: string;
  parentName: string;
}

interface FeeRecord {
  id: string;
  studentId: string;
  amount: number;
  dueDate: string;
  paidAmount: number;
  balance: number;
  status: 'PAID' | 'UNPAID' | 'PARTIAL';
  paymentDate?: string | null;
  paymentMethod?: string | null;
  receiptNumber?: string | null;
  remarks?: string | null;
  student: Student | null;
}

interface FeeComponent {
  id: string;
  feeStructureId: string;
  name: string;
  amount: number;
  dueMonth: string;
  sequence: number;
  createdAt: string;
  updatedAt: string;
}

interface FeeStructure {
  id: string;
  class: string;
  studentType: string;
  academicYear: string;
  totalFees: number;
  admissionFee: number;
  components: FeeComponent[];
  createdAt: string;
  updatedAt: string;
}

export default function FeeManagement() {
  const { user } = useAuth();
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Pay Modal Control
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [selectedFee, setSelectedFee] = useState<FeeRecord | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Add Fee Record Modal Control (New feature!)
  const [addFeeModalOpen, setAddFeeModalOpen] = useState(false);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = useState('Class 8'); // Default to 8th class
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [createAmount, setCreateAmount] = useState('15000');
  const [createDueDate, setCreateDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [createRemarks, setCreateRemarks] = useState('Academic Tuition Fees');
  const [createSubmitting, setCreateSubmitting] = useState(false);
  
  // Fee Structure State
  const [feeStructure, setFeeStructure] = useState<FeeStructure | null>(null);
  const [selectedComponent, setSelectedComponent] = useState<FeeComponent | null>(null);
  const [loadingStructure, setLoadingStructure] = useState(false);

  // Statistics
  const [stats, setStats] = useState({
    totalCollected: 0,
    totalPending: 0,
    collectionRate: 0
  });

  const loadFees = async () => {
    setLoading(true);
    try {
      const qParams = new URLSearchParams();
      if (statusFilter) qParams.set('status', statusFilter);
      if (searchQuery) qParams.set('search', searchQuery);

      const res = await fetch(`/api/fees?${qParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setFees(data);

        // Compute statistics dynamically
        let collected = 0;
        let pending = 0;
        data.forEach((f: FeeRecord) => {
          collected += f.paidAmount;
          pending += f.balance;
        });

        const rate = collected + pending > 0 ? Math.round((collected / (collected + pending)) * 100) : 0;
        setStats({ totalCollected: collected, totalPending: pending, collectionRate: rate });
      } else {
        showToast('Failed to load fees logs', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Connection error', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch all active students for suggestions
  const fetchAllStudents = async () => {
    try {
      const res = await fetch('/api/students');
      if (res.ok) {
        const data = await res.json();
        setAllStudents(data);
      }
    } catch (e) {
      console.error('Failed to retrieve students roster', e);
    }
  };

  // Load fee structure when student is selected
  const loadFeeStructure = async (studentId: string) => {
    if (!studentId) {
      setFeeStructure(null);
      setSelectedComponent(null);
      return;
    }

    setLoadingStructure(true);
    try {
      const student = allStudents.find(s => s.id === studentId);
      if (!student) return;

      // Determine if new or old student - for now assume OLD (can be enhanced with enrollment date logic)
      const studentType = 'OLD';

      const res = await fetch(`/api/fee-structures?academicYear=2026-27`);
      if (res.ok) {
        const structures = await res.json();
        const matched = structures.find((fs: FeeStructure) =>
          fs.class === student.class && fs.studentType === studentType
        );
        if (matched) {
          setFeeStructure(matched);
          setSelectedComponent(matched.components[0] || null);
        }
      }
    } catch (e) {
      console.error('Failed to load fee structure', e);
    } finally {
      setLoadingStructure(false);
    }
  };

  useEffect(() => {
    loadFees();
    fetchAllStudents();
  }, [statusFilter, searchQuery]);

  // Handle class selector side effects: auto-suggest and fill first student
  useEffect(() => {
    const filtered = allStudents.filter(s => s.class === selectedClass);
    if (filtered.length > 0) {
      setSelectedStudentId(filtered[0].id);
    } else {
      setSelectedStudentId('');
    }
  }, [selectedClass, allStudents]);

  // Load fee structure when student is selected
  useEffect(() => {
    loadFeeStructure(selectedStudentId);
  }, [selectedStudentId]);

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleOpenPayModal = (fee: FeeRecord) => {
    setSelectedFee(fee);
    setPayAmount(String(fee.balance)); // Default to outstanding amount
    setPaymentMethod('Cash');
    setRemarks('');
    setPayModalOpen(true);
  };

  const handleOpenAddFeeModal = () => {
    setSelectedClass('Class 8'); // Automatically defaults to Class 8 as requested
    setSelectedStudentId('');
    setFeeStructure(null);
    setSelectedComponent(null);
    setCreateRemarks('Academic Tuition Fees');
    setAddFeeModalOpen(true);
  };

  // Submit recorded payment
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFee || !payAmount) return;

    const amt = parseFloat(payAmount);
    if (isNaN(amt) || amt <= 0) {
      showToast('Invalid payment amount', 'error');
      return;
    }

    if (amt > selectedFee.balance) {
      showToast(`Amount exceeds outstanding balance of ${formatCurrency(selectedFee.balance)}`, 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feeId: selectedFee.id,
          amount: amt,
          paymentMethod,
          remarks
        })
      });

      if (res.ok) {
        showToast(`Collected fee of ${formatCurrency(amt)} successfully`, 'success');
        setPayModalOpen(false);
        loadFees();
      } else {
        const data = await res.json();
        showToast(data.error || 'Fee payment failed', 'error');
      }
    } catch (err) {
      showToast('Server communication failure', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit brand new fee record creation
  const handleCreateFeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !selectedComponent) {
      showToast('Please select a student and installment', 'error');
      return;
    }

    setCreateSubmitting(true);
    try {
      const res = await fetch('/api/fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedStudentId,
          amount: selectedComponent.amount,
          dueDate: createDueDate,
          remarks: selectedComponent.name,
          componentName: selectedComponent.name,
          academicYear: '2026-27'
        })
      });

      if (res.ok) {
        showToast(`Fee for ${selectedComponent.name} successfully added`, 'success');
        setAddFeeModalOpen(false);
        loadFees();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to create fee record', 'error');
      }
    } catch (err) {
      showToast('Failed to contact server', 'error');
    } finally {
      setCreateSubmitting(false);
    }
  };

  // Generate High-Fidelity Printable PDF Receipt on the client-side
  const handlePrintReceipt = (fee: FeeRecord) => {
    if (!fee.receiptNumber) {
      showToast('No receipt generated for this record yet', 'info');
      return;
    }

    try {
      const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a5' // A5 is perfect for receipts
      });

      // Colors
      const primaryColor = '#1d4ed8'; // Royal Blue
      const darkColor = '#0f172a'; // Slate 900
      const mutedColor = '#64748b'; // Slate 500

      // Receipt Box Border
      doc.setDrawColor(226, 232, 240);
      doc.rect(5, 5, 138, 200);

      // Header Banner
      doc.setFillColor(29, 78, 216);
      doc.rect(5, 5, 138, 25, 'F');

      // School Name
      doc.setTextColor(255, 255, 255);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(16);
      doc.text("ANGELS WORLD SCHOOL", 74, 15, { align: 'center' });
      doc.setFontSize(8);
      doc.setFont('Helvetica', 'normal');
      doc.text("Academic Excellence & Character Development Portal", 74, 21, { align: 'center' });

      // Transaction Receipt Title
      doc.setTextColor(darkColor);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(12);
      doc.text("FEE PAYMENT RECEIPT", 74, 42, { align: 'center' });

      // Divider
      doc.setDrawColor(226, 232, 240);
      doc.line(10, 48, 138, 48);

      // Receipt details block
      doc.setFontSize(9);
      doc.setTextColor(mutedColor);
      doc.setFont('Helvetica', 'normal');
      doc.text("Receipt Number:", 12, 56);
      doc.setTextColor(darkColor);
      doc.setFont('Helvetica', 'bold');
      doc.text(String(fee.receiptNumber), 45, 56);

      doc.setTextColor(mutedColor);
      doc.setFont('Helvetica', 'normal');
      doc.text("Payment Date:", 80, 56);
      doc.setTextColor(darkColor);
      doc.setFont('Helvetica', 'bold');
      const pDate = fee.paymentDate ? new Date(fee.paymentDate).toLocaleDateString('en-IN') : 'N/A';
      doc.text(pDate, 105, 56);

      doc.setTextColor(mutedColor);
      doc.setFont('Helvetica', 'normal');
      doc.text("Student Name:", 12, 64);
      doc.setTextColor(darkColor);
      doc.setFont('Helvetica', 'bold');
      doc.text(fee.student?.name || 'N/A', 45, 64);

      doc.setTextColor(mutedColor);
      doc.setFont('Helvetica', 'normal');
      doc.text("Admission No:", 80, 64);
      doc.setTextColor(darkColor);
      doc.setFont('Helvetica', 'bold');
      doc.text(fee.student?.admissionNumber || 'N/A', 105, 64);

      doc.setTextColor(mutedColor);
      doc.setFont('Helvetica', 'normal');
      doc.text("Class Section:", 12, 72);
      doc.setTextColor(darkColor);
      doc.setFont('Helvetica', 'bold');
      doc.text(`${fee.student?.class || ''}-${fee.student?.section || ''}`, 45, 72);

      doc.setTextColor(mutedColor);
      doc.setFont('Helvetica', 'normal');
      doc.text("Payment Method:", 80, 72);
      doc.setTextColor(darkColor);
      doc.setFont('Helvetica', 'bold');
      doc.text(String(fee.paymentMethod || 'Cash'), 105, 72);

      // Table Header for Breakdown
      doc.setFillColor(248, 250, 252);
      doc.rect(10, 84, 128, 8, 'F');
      doc.setTextColor(mutedColor);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8);
      doc.text("PARTICULARS", 15, 89);
      doc.text("AMOUNT (INR)", 110, 89);

      // Table Rows
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(darkColor);
      doc.text("Monthly Academic & Session Fees", 15, 100);
      doc.text(formatCurrency(fee.amount), 110, 100);

      // Dividers
      doc.line(10, 106, 138, 106);

      // Calculations Blocks
      doc.setTextColor(mutedColor);
      doc.text("Total Monthly Fees:", 70, 115);
      doc.setTextColor(darkColor);
      doc.setFont('Helvetica', 'bold');
      doc.text(formatCurrency(fee.amount), 110, 115);

      doc.setTextColor(mutedColor);
      doc.setFont('Helvetica', 'normal');
      doc.text("Amount Paid:", 70, 123);
      doc.setTextColor(primaryColor);
      doc.setFont('Helvetica', 'bold');
      doc.text(formatCurrency(fee.paidAmount), 110, 123);

      doc.setTextColor(mutedColor);
      doc.setFont('Helvetica', 'normal');
      doc.text("Outstanding Balance:", 70, 131);
      doc.setTextColor('#ef4444');
      doc.setFont('Helvetica', 'bold');
      doc.text(formatCurrency(fee.balance), 110, 131);

      // Remarks Block
      doc.setDrawColor(241, 245, 249);
      doc.setFillColor(248, 250, 252);
      doc.rect(10, 142, 128, 18, 'F');
      doc.setTextColor(mutedColor);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(7);
      doc.text("OFFICIAL COMMENT / REMARKS", 14, 147);
      doc.setTextColor(darkColor);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(fee.remarks || "Receipt successfully compiled via cloud SaaS portal.", 14, 153);

      // Verification Watermark Official stamp mock
      doc.setDrawColor(16, 185, 129);
      doc.rect(15, 172, 35, 15);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(16, 185, 129);
      doc.text("PAID & VERIFIED", 32.5, 179, { align: 'center' });
      doc.setFontSize(6);
      doc.text("ANGELS WORLD SCHOOL", 32.5, 184, { align: 'center' });

      // Signatures
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(darkColor);
      doc.text("Authorized Signature", 100, 182);
      doc.line(95, 175, 130, 175);
      doc.setFontSize(6);
      doc.setTextColor(mutedColor);
      doc.text("AWS Accounts Office Seal", 97, 186);

      // Save PDF document
      doc.save(`AWS_Receipt_${fee.receiptNumber}.pdf`);
      showToast(`Receipt PDF AWS_Receipt_${fee.receiptNumber}.pdf downloaded!`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to compile receipt PDF', 'error');
    }
  };

  const hasCollectionAccess = user?.role === 'ADMIN' || user?.role === 'ACCOUNTANT';

  // Filter students based on selected class in the Add Fee modal
  const classFilteredStudents = allStudents.filter(s => s.class === selectedClass);

  return (
    <div className="space-y-6 relative">
      {/* Toast popups */}
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
            <BadgeCent className="h-6 w-6 text-primary-500" />
            Fee Management Portal
          </h1>
          <p className="text-xs text-slate-500 mt-1">Monitor school balances, process fee collection, and download receipts</p>
        </div>

        {hasCollectionAccess && (
          <button
            onClick={handleOpenAddFeeModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 rounded-xl text-xs font-semibold text-white cursor-pointer shadow-md shadow-primary-200 transition-colors shrink-0"
          >
            <PlusCircle className="h-4 w-4" />
            Add Student Fee Record
          </button>
        )}
      </div>

      {/* Overview Cards Block */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Collected */}
        <div className="bg-white p-5 border border-slate-100 rounded-3xl shadow-xs flex items-center justify-between hover-card">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Fees Collected</span>
            <div className="text-2xl font-extrabold text-emerald-600">{formatCurrency(stats.totalCollected)}</div>
            <span className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> Fully Verified
            </span>
          </div>
          <div className="h-12 w-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
            <FileCheck2 className="h-5 w-5" />
          </div>
        </div>

        {/* Total Pending */}
        <div className="bg-white p-5 border border-slate-100 rounded-3xl shadow-xs flex items-center justify-between hover-card">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Outstanding Balance</span>
            <div className="text-2xl font-extrabold text-red-500">{formatCurrency(stats.totalPending)}</div>
            <span className="text-[10px] text-amber-600 font-semibold flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5" /> Requires Follow Up
            </span>
          </div>
          <div className="h-12 w-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center shrink-0">
            <AlertCircle className="h-5 w-5" />
          </div>
        </div>

        {/* Collection rate */}
        <div className="bg-white p-5 border border-slate-100 rounded-3xl shadow-xs flex items-center justify-between hover-card">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Collection Rate</span>
            <div className="text-2xl font-extrabold text-primary-600">{stats.collectionRate}%</div>
            <span className="text-[10px] text-slate-400 block font-semibold">Targets: 2026-2027</span>
          </div>
          <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
            <Sparkles className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Search & Filter Filters */}
      <div className="bg-white p-4 border border-slate-100 rounded-2xl shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-85 shadow-xs">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Search by student name, admission number, or receipt number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-primary-500 focus:bg-white text-xs transition-all"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto shrink-0 justify-end">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1 text-slate-500">
            <Filter className="h-3.5 w-3.5" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 outline-hidden cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="PAID">Paid</option>
              <option value="UNPAID">Unpaid</option>
              <option value="PARTIAL">Partial</option>
            </select>
          </div>
        </div>
      </div>

      {/* Fee Table logs */}
      <div className="bg-white border border-slate-100 rounded-3xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
            <span className="text-xs text-slate-400 font-bold">Retrieving fee ledger logs...</span>
          </div>
        ) : fees.length === 0 ? (
          <div className="p-16 text-center text-slate-400 flex flex-col items-center gap-3">
            <ClipboardList className="h-10 w-10 text-slate-300" />
            <div>
              <h3 className="font-bold text-slate-700 text-sm">No Ledger Entries</h3>
              <p className="text-xs text-slate-400 mt-1">Try tweaking filters or look for another name</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Total Amount</th>
                  <th className="px-6 py-4">Amount Paid</th>
                  <th className="px-6 py-4">Outstanding Balance</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Receipt Info</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                {fees.map((fee) => (
                  <tr key={fee.id} className="hover:bg-slate-50/75 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <span className="font-extrabold text-slate-800 block">{fee.student?.name}</span>
                        <span className="text-[10px] text-slate-400">{fee.student?.admissionNumber} • {fee.student?.class}-{fee.student?.section}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-850">
                      {formatCurrency(fee.amount)}
                    </td>
                    <td className="px-6 py-4 text-emerald-600 font-bold">
                      {formatCurrency(fee.paidAmount)}
                    </td>
                    <td className="px-6 py-4 text-red-500 font-bold">
                      {formatCurrency(fee.balance)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                        fee.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' :
                        fee.status === 'PARTIAL' ? 'bg-amber-100 text-amber-800' :
                        'bg-rose-100 text-rose-800'
                      }`}>
                        {fee.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 leading-normal">
                      {fee.receiptNumber ? (
                        <div>
                          <span className="font-bold text-slate-700 block">{fee.receiptNumber}</span>
                          <span className="text-[10px] text-slate-400">{fee.paymentMethod}</span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic font-medium text-slate-400">
                          Due: {fee.dueDate ? new Date(fee.dueDate).toLocaleDateString('en-IN') : 'N/A'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex gap-2 justify-end">
                        {fee.receiptNumber && (
                          <button
                            onClick={() => handlePrintReceipt(fee)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600 cursor-pointer font-bold transition-all text-[10px]"
                            title="Generate PDF Receipt"
                          >
                            <Printer className="h-3 w-3" />
                            PDF Receipt
                          </button>
                        )}
                        
                        {hasCollectionAccess && fee.balance > 0 && (
                          <button
                            onClick={() => handleOpenPayModal(fee)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 rounded-lg text-white cursor-pointer font-bold shadow-xs transition-all text-[10px]"
                          >
                            Collect Fee
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- ADD FEE RECORD MODAL DIALOG (New Feature!) --- */}
      {addFeeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-100 w-full max-w-md rounded-3xl shadow-2xl flex flex-col animate-slide-in">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h3 className="font-extrabold text-slate-800 text-sm md:text-base flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary-500" />
                Add Student Fee Record
              </h3>
              <button onClick={() => setAddFeeModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold p-1">✕</button>
            </div>
            
            <form onSubmit={handleCreateFeeSubmit} className="p-6 space-y-4 text-xs font-semibold text-slate-700">
              {/* Class Selector */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Select Target Class</label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="block w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 cursor-pointer focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-hidden text-xs"
                >
                  <option value="Class 5">Class 5</option>
                  <option value="Class 6">Class 6</option>
                  <option value="Class 7">Class 7</option>
                  <option value="Class 8">Class 8</option>
                </select>
              </div>

              {/* Student Selector Dropdown (Suggests dynamically based on selected class!) */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Select Student (Auto-Suggested)</label>
                {classFilteredStudents.length === 0 ? (
                  <div className="bg-rose-50 border border-rose-100 rounded-xl px-3 py-2.5 text-rose-700 font-bold text-xs">
                    No active students registered in {selectedClass}
                  </div>
                ) : (
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="block w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 cursor-pointer focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-hidden text-xs"
                  >
                    {classFilteredStudents.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.admissionNumber})</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Fee Structure Display */}
              {feeStructure && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-blue-700">Total Annual Fees:</span>
                    <span className="text-sm font-bold text-blue-900">{formatCurrency(feeStructure.totalFees)}</span>
                  </div>

                  {/* Installment Selection */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600">Select Installment:</label>
                    <div className="space-y-2">
                      {feeStructure.components.map((component) => (
                        <label key={component.id} className="flex items-center gap-3 p-3 border border-blue-200 rounded-lg hover:bg-blue-100/50 cursor-pointer transition-colors">
                          <input
                            type="radio"
                            name="installment"
                            value={component.id}
                            checked={selectedComponent?.id === component.id}
                            onChange={() => setSelectedComponent(component)}
                            className="w-4 h-4 text-primary-600 cursor-pointer"
                          />
                          <div className="flex-1">
                            <div className="text-xs font-bold text-slate-800">{component.name}</div>
                            <div className="text-[10px] text-slate-500">Due: {component.dueMonth}</div>
                          </div>
                          <div className="text-sm font-bold text-primary-600">{formatCurrency(component.amount)}</div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {loadingStructure && (
                <div className="text-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-primary-600 mx-auto mb-2" />
                  <span className="text-xs text-slate-500">Loading fee structure...</span>
                </div>
              )}

              {/* Due Date */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Payment Due Date</label>
                <input
                  type="date"
                  required
                  value={createDueDate}
                  onChange={(e) => setCreateDueDate(e.target.value)}
                  className="block w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-hidden text-xs cursor-pointer"
                />
                {selectedComponent && (
                  <div className="text-[10px] text-slate-500 mt-1">
                    Installment: <span className="font-bold text-primary-600">{selectedComponent.dueMonth}</span>
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="flex gap-2 justify-end border-t border-slate-100 pt-4 shrink-0">
                <button
                  type="button"
                  onClick={() => setAddFeeModalOpen(false)}
                  className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting || !selectedComponent}
                  className="flex items-center gap-1.5 px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-xl text-xs font-semibold text-white shadow-md cursor-pointer disabled:bg-primary-400"
                >
                  {createSubmitting ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Add Fee Record'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- PAYMENT RECORD MODAL DIALOG --- */}
      {payModalOpen && selectedFee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-100 w-full max-w-md rounded-3xl shadow-2xl flex flex-col animate-slide-in">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h3 className="font-extrabold text-slate-800 text-sm md:text-base flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary-500" />
                Collect Fee Payment
              </h3>
              <button onClick={() => setPayModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold p-1">✕</button>
            </div>
            
            <form onSubmit={handlePaymentSubmit} className="p-6 space-y-4 text-xs font-semibold text-slate-700">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Student:</span>
                  <span className="font-extrabold text-slate-800">{selectedFee.student?.name}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Admission No:</span>
                  <span className="font-extrabold text-slate-800 font-mono">{selectedFee.student?.admissionNumber}</span>
                </div>
                <div className="flex justify-between items-center text-xs border-t border-slate-200/50 pt-2">
                  <span className="text-slate-400">Outstanding Balance:</span>
                  <span className="font-extrabold text-red-500 text-sm">{formatCurrency(selectedFee.balance)}</span>
                </div>
              </div>

              {/* Pay Amount */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Collect Payment Amount (INR)</label>
                <input
                  type="number"
                  required
                  max={selectedFee.balance}
                  min={1}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="block w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary-500 text-sm font-bold focus:outline-hidden"
                  placeholder="Enter amount..."
                />
              </div>

              {/* Payment Method */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="block w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 cursor-pointer focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-hidden text-xs"
                >
                  <option value="Cash">Cash</option>
                  <option value="Card">Credit/Debit Card</option>
                  <option value="Online">UPI Online (GPay/PhonePe)</option>
                  <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                </select>
              </div>

              {/* Remarks */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Remarks / Notes</label>
                <textarea
                  rows={2}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="block w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-hidden text-xs"
                  placeholder="e.g., Paid first installment..."
                />
              </div>

              {/* Modal Actions */}
              <div className="flex gap-2 justify-end border-t border-slate-100 pt-4 shrink-0">
                <button
                  type="button"
                  onClick={() => setPayModalOpen(false)}
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
                      Processing...
                    </>
                  ) : (
                    'Record Payment'
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
