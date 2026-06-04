'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  UserPlus,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  Settings,
  HelpCircle,
  Edit2,
  Trash2
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
  componentName?: string | null;
  academicYear?: string | null;
  student: Student | null;
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

const MONTH_NAMES: Record<string, string> = {
  JAN: 'January',
  FEB: 'February',
  MAR: 'March',
  APR: 'April',
  MAY: 'May',
  JUN: 'June',
  JUL: 'July',
  AUG: 'August',
  SEP: 'September',
  OCT: 'October',
  NOV: 'November',
  DEC: 'December'
};

export default function FeeManagement() {
  const { user } = useAuth();
  
  // Data States
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');

  // Modal Control States
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Payment Form Modal States
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [showStudentSuggestions, setShowStudentSuggestions] = useState(false);

  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedClass, setSelectedClass] = useState('Class 7');
  const [selectedSection, setSelectedSection] = useState('A');
  const [studentType, setStudentType] = useState<'NEW' | 'OLD'>('OLD');
  const [admissionNumber, setAdmissionNumber] = useState('');
  const [formStep, setFormStep] = useState(1);
  const [paymentType, setPaymentType] = useState<'INSTALLMENT' | 'DIRECT'>('INSTALLMENT');
  const [selectedInstallment, setSelectedInstallment] = useState<'INSTALLMENT_1' | 'INSTALLMENT_2' | 'INSTALLMENT_3'>('INSTALLMENT_1');
  const [totalInstallmentAmount, setTotalInstallmentAmount] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('APR');
  const [totalMonthAmount, setTotalMonthAmount] = useState('');
  
  const [amountReceived, setAmountReceived] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [receivedDate, setReceivedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [remarks, setRemarks] = useState('');
  const [savingPayment, setSavingPayment] = useState(false);

  // Edit Form Modal States
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<FeeRecord | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editPaidAmount, setEditPaidAmount] = useState('');
  const [editPaymentMethod, setEditPaymentMethod] = useState('Cash');
  const [editRemarks, setEditRemarks] = useState('');
  const [editComponentName, setEditComponentName] = useState('');
  const [submittingEdit, setSubmittingEdit] = useState(false);

  // Fetch Student Roster
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

  // Fetch Fee Records
  const loadFees = async () => {
    try {
      const res = await fetch('/api/fees');
      if (res.ok) {
        const data = await res.json();
        setFees(data);
      }
    } catch (e) {
      console.error('Failed to load fees logs', e);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchAllStudents(), loadFees()]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

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

  // Autofill fields when student selected
  const handleStudentSelect = (student: Student) => {
    setSelectedStudentId(student.id);
    setSelectedClass(student.class);
    setSelectedSection(student.section);
    setAdmissionNumber(student.admissionNumber || '');
    setStudentSearchQuery(student.name);
    setShowStudentSuggestions(false);
    
    // Default to OLD student type, can be changed by user
    setStudentType('OLD');
  };

  // Clear Payment Form
  const resetPaymentForm = () => {
    setSelectedStudentId('');
    setSelectedClass('Class 7');
    setSelectedSection('A');
    setStudentType('OLD');
    setAdmissionNumber('');
    setStudentSearchQuery('');
    setShowStudentSuggestions(false);
    setTotalInstallmentAmount('');
    setSelectedMonth('APR');
    setTotalMonthAmount('');
    setAmountReceived('');
    setPaymentMode('Cash');
    setReceivedDate(new Date().toISOString().split('T')[0]);
    setRemarks('');
    setFormStep(1);
    setPaymentType('INSTALLMENT');
    setSelectedInstallment('INSTALLMENT_1');
  };

  // Get active student fee logs
  const activeStudentFeeRecords = fees.filter(f => f.studentId === selectedStudentId);

  // Summary Calculations for Payment Form
  const getSelectedStudentSummary = () => {
    const totalFee = activeStudentFeeRecords.reduce((acc, curr) => acc + curr.amount, 0);
    const totalPaid = activeStudentFeeRecords.reduce((acc, curr) => acc + curr.paidAmount, 0);
    const balance = Math.max(0, totalFee - totalPaid);

    // Get last payment info from history
    const paidRecords = activeStudentFeeRecords.filter(f => f.paymentDate && f.paidAmount > 0);
    let lastPaymentAmount = 0;
    let lastPaymentDate = null;

    if (paidRecords.length > 0) {
      const sorted = [...paidRecords].sort((a, b) => new Date(b.paymentDate!).getTime() - new Date(a.paymentDate!).getTime());
      lastPaymentAmount = sorted[0].paidAmount;
      lastPaymentDate = sorted[0].paymentDate;
    }

    return { totalFee, totalPaid, balance, lastPaymentAmount, lastPaymentDate };
  };

  const {
    totalFee: formTotalFee,
    totalPaid: formTotalPaid,
    balance: formBalance,
    lastPaymentAmount: formLastAmount,
    lastPaymentDate: formLastDate
  } = getSelectedStudentSummary();

  const formatReceiptDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return 'N/A';
    }
  };

  // Get status of an installment for selected student
  const getInstallmentStatus = (code: string) => {
    const record = activeStudentFeeRecords.find(f => f.componentName?.toUpperCase() === code.toUpperCase());
    if (!record) return 'Pending';
    if (record.status === 'PAID') return 'Paid';
    if (record.status === 'PARTIAL') return 'Partial';
    return 'Pending';
  };

  // Get status of a month for selected student
  const getMonthStatus = (code: string) => {
    const record = activeStudentFeeRecords.find(f => f.componentName?.toUpperCase() === code.toUpperCase());
    if (!record) return 'Pending';
    if (record.status === 'PAID') return 'Paid';
    if (record.status === 'PARTIAL') return 'Partial';
    return 'Pending';
  };

  // Submit payment handler
  const handleSavePayment = async () => {
    const studentId = selectedStudentId;

    if (!studentId) {
      showToast('Please search and select a student', 'error');
      return;
    }

    if (!amountReceived || amountReceived.trim() === '') {
      showToast('Please enter the Amount Received.', 'error');
      setSavingPayment(false);
      return;
    }

    const amt = parseFloat(amountReceived);
    if (isNaN(amt) || amt <= 0) {
      showToast('Please enter a valid positive amount received.', 'error');
      setSavingPayment(false);
      return;
    }

    setSavingPayment(true);

    try {
      const itemCode = paymentType === 'INSTALLMENT' ? selectedInstallment : selectedMonth;
      const targetTotalAmount = paymentType === 'INSTALLMENT' ? totalInstallmentAmount : totalMonthAmount;
      
      let existingRecord = fees.filter(f => f.studentId === studentId).find(f => 
        f.componentName?.toUpperCase() === itemCode.toUpperCase()
      );

      let targetFeeId = '';
      let targetAmount = 0;

      if (!existingRecord) {
        if (!targetTotalAmount || targetTotalAmount.trim() === '') {
          showToast('Please enter the Total Fee Amount', 'error');
          setSavingPayment(false);
          return;
        }
        const totalAmt = parseFloat(targetTotalAmount);
        if (isNaN(totalAmt) || totalAmt <= 0) {
          showToast('Please enter a valid positive Total Fee Amount', 'error');
          setSavingPayment(false);
          return;
        }
        if (amt > totalAmt) {
          showToast('Amount being paid cannot exceed the Total Fee', 'error');
          setSavingPayment(false);
          return;
        }

        // 1. Create a fee record with the correct componentName and academicYear
        const createRes = await fetch('/api/fees', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentId,
            amount: totalAmt,
            dueDate: new Date().toISOString(),
            remarks: paymentType === 'INSTALLMENT'
              ? `${selectedInstallment === 'INSTALLMENT_1' ? 'Installment 1' : selectedInstallment === 'INSTALLMENT_2' ? 'Installment 2' : 'Installment 3'} Fee`
              : `${selectedMonth} Monthly Fee`,
            componentName: itemCode,
            academicYear: '2026-27'
          })
        });

        if (createRes.ok) {
          const createData = await createRes.json();
          targetFeeId = createData.fee.id;
          targetAmount = totalAmt;
        } else {
          showToast('Failed to create billing record', 'error');
          setSavingPayment(false);
          return;
        }
      } else {
        if (amt > existingRecord.balance) {
          showToast(`Amount being paid cannot exceed the remaining balance of ${formatCurrency(existingRecord.balance)}`, 'error');
          setSavingPayment(false);
          return;
        }
        targetFeeId = existingRecord.id;
        targetAmount = existingRecord.balance;
      }

      // 2. Submit payment record
      const payRes = await fetch('/api/fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feeId: targetFeeId,
          amount: amt,
          paymentMethod: paymentMode,
          remarks: remarks || `Collected on ${receivedDate}`
        })
      });

      if (payRes.ok) {
        showToast('Payment recorded successfully', 'success');
        await loadFees();
        setShowPaymentModal(false);
        resetPaymentForm();
      } else {
        showToast('Failed to record payment', 'error');
      }

    } catch (err) {
      console.error(err);
      showToast('Error recording payment', 'error');
    } finally {
      setSavingPayment(false);
    }
  };

  // Open Edit Modal
  const handleOpenEditModal = (record: FeeRecord) => {
    setEditingRecord(record);
    setEditAmount(String(record.amount));
    setEditPaidAmount(String(record.paidAmount));
    setEditPaymentMethod(record.paymentMethod || 'Cash');
    setEditRemarks(record.remarks || '');
    setEditComponentName(record.componentName || 'School Fee');
    setShowEditModal(true);
  };

  // Submit Edit Payment
  const handleSaveEdit = async () => {
    if (!editingRecord) return;
    const amt = parseFloat(editAmount);
    const paid = parseFloat(editPaidAmount);

    if (isNaN(amt) || amt <= 0) {
      showToast('Please enter a valid positive fee amount', 'error');
      return;
    }
    if (isNaN(paid) || paid < 0) {
      showToast('Please enter a valid paid amount', 'error');
      return;
    }
    if (paid > amt) {
      showToast('Paid amount cannot exceed total fee amount', 'error');
      return;
    }

    setSubmittingEdit(true);
    try {
      const res = await fetch(`/api/fees/${editingRecord.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amt,
          paidAmount: paid,
          paymentMethod: editPaymentMethod,
          remarks: editRemarks,
          componentName: editComponentName
        })
      });

      if (res.ok) {
        showToast('Billing record updated successfully', 'success');
        await loadFees();
        setShowEditModal(false);
        setEditingRecord(null);
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to update record', 'error');
      }
    } catch (e) {
      showToast('Connection failed during update', 'error');
    } finally {
      setSubmittingEdit(false);
    }
  };

  // Delete Payment Record
  const handleDeleteRecord = async (id: string) => {
    let confirmed = false;
    try {
      confirmed = window.confirm('Are you absolutely sure you want to permanently delete this billing record? This action cannot be undone.');
    } catch (e) {
      console.warn('Confirm blocked, bypassing:', e);
      confirmed = true;
    }

    if (!confirmed) return;

    try {
      const res = await fetch(`/api/fees/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Billing record deleted successfully', 'success');
        await loadFees();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to delete record', 'error');
      }
    } catch (e) {
      showToast('Connection error during deletion', 'error');
    }
  };

  const existingRecordForSelected = selectedStudentId 
    ? fees.filter(f => f.studentId === selectedStudentId).find(f => 
        f.componentName?.toUpperCase() === selectedInstallment.toUpperCase()
      )
    : null;

  const existingRecordForSelectedMonth = selectedStudentId 
    ? fees.filter(f => f.studentId === selectedStudentId).find(f => 
        f.componentName?.toUpperCase() === selectedMonth.toUpperCase()
      )
    : null;

  const handleTotalAmountChange = (val: string) => {
    setTotalInstallmentAmount(val);
    setAmountReceived(val);
  };

  const handleTotalMonthAmountChange = (val: string) => {
    setTotalMonthAmount(val);
    setAmountReceived(val);
  };

  // Print PDF receipt builder
  const handlePrintReceipt = (fee: FeeRecord) => {
    if (!fee.receiptNumber) {
      showToast('No receipt generated for this record yet', 'info');
      return;
    }

    try {
      const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a5'
      });

      const primaryColor = '#1d4ed8';
      const darkColor = '#0f172a';
      const mutedColor = '#64748b';

      doc.setDrawColor(226, 232, 240);
      doc.rect(5, 5, 138, 200);

      doc.setFillColor(29, 78, 216);
      doc.rect(5, 5, 138, 25, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(16);
      doc.text("ANGELS WORLD SCHOOL", 74, 15, { align: 'center' });
      doc.setFontSize(8);
      doc.setFont('Helvetica', 'normal');
      doc.text("Academic Excellence & Character Development Portal", 74, 21, { align: 'center' });

      doc.setTextColor(darkColor);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(12);
      doc.text("FEE PAYMENT RECEIPT", 74, 42, { align: 'center' });

      doc.setDrawColor(226, 232, 240);
      doc.line(10, 48, 138, 48);

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

      doc.setFillColor(248, 250, 252);
      doc.rect(10, 84, 128, 8, 'F');
      doc.setTextColor(mutedColor);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8);
      doc.text("PARTICULARS", 15, 89);
      doc.text("AMOUNT (INR)", 110, 89);

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(darkColor);
      doc.text(`${fee.componentName || 'School fees'}`, 15, 100);
      doc.text(formatCurrency(fee.amount), 110, 100);

      doc.line(10, 106, 138, 106);

      doc.setTextColor(mutedColor);
      doc.text("Total Fees:", 70, 115);
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

      doc.setDrawColor(16, 185, 129);
      doc.rect(15, 172, 35, 15);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(16, 185, 129);
      doc.text("PAID & VERIFIED", 32.5, 179, { align: 'center' });
      doc.setFontSize(6);
      doc.text("ANGELS WORLD SCHOOL", 32.5, 184, { align: 'center' });

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(darkColor);
      doc.text("Authorized Signature", 100, 182);
      doc.line(95, 175, 130, 175);
      doc.setFontSize(6);
      doc.setTextColor(mutedColor);
      doc.text("AWS Accounts Office Seal", 97, 186);

      doc.save(`AWS_Receipt_${fee.receiptNumber}.pdf`);
      showToast(`Receipt PDF AWS_Receipt_${fee.receiptNumber}.pdf downloaded!`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to compile receipt PDF', 'error');
    }
  };


  const filteredSearchStudents = allStudents.filter(s =>
    s.name.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
    (s.admissionNumber && s.admissionNumber.toLowerCase().includes(studentSearchQuery.toLowerCase()))
  );

  const filteredFees = fees.filter(f =>
    f.student?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (f.student?.admissionNumber && f.student.admissionNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (f.receiptNumber && f.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 relative">
      {/* Toast notifications */}
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
            School Fee Ledger & Billing
          </h1>
          <p className="text-xs text-slate-500 mt-1">Record and track student payment logs</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => {
              resetPaymentForm();
              setShowPaymentModal(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-primary-200 transition-all cursor-pointer"
          >
            <PlusCircle className="h-4 w-4" />
            Collect Fee Payment
          </button>
        </div>
      </div>

      {/* CONTENTS */}
      {loading ? (
        <div className="p-12 text-center flex flex-col items-center gap-2 bg-white border border-slate-100 rounded-3xl">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          <span className="text-xs text-slate-400 font-bold">Refreshing billing metrics...</span>
        </div>
      ) : (
        <div className="space-y-4">
          {/* SEARCH & FILTERS */}
          <div className="bg-white p-4 border border-slate-100 rounded-2xl shadow-xs flex items-center justify-between">
            <div className="relative w-80 shadow-xs">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                placeholder="Search by Name, Adm No, Receipt No..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-primary-500 focus:bg-white text-xs transition-all"
              />
            </div>
          </div>

          {/* PAYMENTS HISTORY TABLE */}
          <div className="bg-white border border-slate-100 rounded-3xl shadow-xs overflow-hidden">
            {filteredFees.length === 0 ? (
              <div className="p-12 text-center text-slate-400 italic text-xs">
                No fee records found. Click "+ Collect Fee Payment" to record a new payment transaction.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="px-6 py-4">Receipt No.</th>
                      <th className="px-6 py-4">Student Name</th>
                      <th className="px-6 py-4">Class & Sec</th>
                      <th className="px-6 py-4">Component</th>
                      <th className="px-6 py-4 text-right">Amount</th>
                      <th className="px-6 py-4 text-right">Paid</th>
                      <th className="px-6 py-4 text-right">Balance</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                    {filteredFees.map(fee => (
                      <tr key={fee.id} className="hover:bg-slate-50/75 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-800">{fee.receiptNumber || '—'}</td>
                        <td className="px-6 py-4 font-extrabold text-slate-800">{fee.student?.name}</td>
                        <td className="px-6 py-4">
                          <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-bold">
                            {fee.student?.class}-{fee.student?.section}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-500 uppercase">{fee.componentName || 'School Fee'}</td>
                        <td className="px-6 py-4 text-right font-bold text-slate-800">{formatCurrency(fee.amount)}</td>
                        <td className="px-6 py-4 text-right font-bold text-emerald-650">{formatCurrency(fee.paidAmount)}</td>
                        <td className="px-6 py-4 text-right font-bold text-rose-500">{formatCurrency(fee.balance)}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase ${
                            fee.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' :
                            fee.status === 'PARTIAL' ? 'bg-amber-100 text-amber-800' :
                            'bg-rose-100 text-rose-800'
                          }`}>
                            {fee.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1.5">
                            {fee.status !== 'UNPAID' && (
                              <button
                                onClick={() => handlePrintReceipt(fee)}
                                className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600 cursor-pointer transition-colors"
                                title="Print Receipt"
                              >
                                <Printer className="h-3.5 w-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => handleOpenEditModal(fee)}
                              className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-primary-600 hover:text-primary-750 cursor-pointer transition-colors"
                              title="Edit Record"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteRecord(fee.id)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg text-rose-600 hover:text-rose-750 cursor-pointer transition-colors"
                              title="Delete Record"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- MODAL 1: COLLECT FEE PAYMENT --- */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-100 w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] animate-slide-in">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h3 className="font-extrabold text-slate-800 text-sm md:text-base flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary-500" />
                Collect Fee Payment
              </h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-600 font-bold p-1">✕</button>
            </div>

            {/* Scroll Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs font-medium text-slate-700">

              {/* Student Identification */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 relative">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Search Student *</label>
                  <input
                    type="text"
                    placeholder="Type name or admission number..."
                    value={studentSearchQuery}
                    onChange={(e) => {
                      setStudentSearchQuery(e.target.value);
                      setShowStudentSuggestions(true);
                    }}
                    onFocus={() => setShowStudentSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowStudentSuggestions(false), 250)}
                    className="block w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-hidden"
                  />
                  {showStudentSuggestions && studentSearchQuery && filteredSearchStudents.length > 0 && (
                    <div className="absolute z-50 left-0 right-0 mt-1 max-h-40 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg divide-y divide-slate-150 shrink-0">
                      {filteredSearchStudents.map(student => (
                        <button
                          key={student.id}
                          type="button"
                          onClick={() => handleStudentSelect(student)}
                          className="w-full text-left px-4 py-2 hover:bg-slate-50 transition-colors flex flex-col cursor-pointer"
                        >
                          <span className="font-bold text-slate-800 text-xs">{student.name}</span>
                          <span className="text-[10px] text-slate-400">Class: {student.class}-{student.section} • Adm No: {student.admissionNumber}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Admission No.</label>
                  <input
                    type="text"
                    disabled
                    placeholder="Loaded automatically"
                    value={admissionNumber}
                    className="block w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-100 text-slate-500 cursor-not-allowed focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Class, Section, Type */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Class</label>
                  <select
                    disabled
                    value={selectedClass}
                    className="block w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-100 text-slate-500 cursor-not-allowed focus:outline-hidden"
                  >
                    {Object.keys(CLASS_SECTION_MAP).map(cls => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Section</label>
                  <select
                    disabled
                    value={selectedSection}
                    className="block w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-100 text-slate-500 cursor-not-allowed focus:outline-hidden"
                  >
                    {(CLASS_SECTION_MAP[selectedClass] || ['A']).map(sec => (
                      <option key={sec} value={sec}>{sec}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Student Type</label>
                  <select
                    disabled
                    value={studentType}
                    className="block w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-100 text-slate-500 cursor-not-allowed focus:outline-hidden"
                  >
                    <option value="OLD">Old Student</option>
                    <option value="NEW">New Student</option>
                  </select>
                </div>
              </div>

              {/* STUDENT PAYMENT SUMMARY */}
              {selectedStudentId && (
                <div className="bg-slate-50 p-4 border border-slate-200/50 rounded-2xl space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-slate-200/50 pb-2">
                    <h4 className="font-extrabold text-slate-800 text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-primary-500" />
                      Student Payment Summary
                    </h4>
                    <span className="text-[9px] bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded-full uppercase">
                      Billing Profile
                    </span>
                  </div>

                  {/* Financial metrics grid */}
                  <div className="grid grid-cols-3 gap-2.5 text-center">
                    <div className="bg-white p-2 border border-slate-100 rounded-xl shadow-3xs">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Total Fee</span>
                      <div className="font-black text-slate-800 mt-0.5 text-xs">{formatCurrency(formTotalFee)}</div>
                    </div>
                    <div className="bg-white p-2 border border-slate-100 rounded-xl shadow-3xs">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Total Paid</span>
                      <div className="font-black text-emerald-600 mt-0.5 text-xs">{formatCurrency(formTotalPaid)}</div>
                    </div>
                    <div className="bg-white p-2 border border-slate-100 rounded-xl shadow-3xs">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Remaining Balance</span>
                      <div className="font-black text-rose-500 mt-0.5 text-xs">{formatCurrency(formBalance)}</div>
                    </div>
                  </div>

                  {/* Last payment info bar */}
                  <div className="bg-white p-2.5 border border-slate-100 rounded-xl flex items-center justify-between text-slate-600 shadow-3xs">
                    <div>
                      <span className="block text-[8px] text-slate-400 uppercase font-bold tracking-wide">Last Payment Amount</span>
                      <span className="font-extrabold text-slate-800 text-[11px] mt-0.5 block">
                        {formLastAmount > 0 ? formatCurrency(formLastAmount) : 'No payments recorded'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-primary-400 uppercase font-bold">Active Student context</span>
                      <div className="font-extrabold text-primary-900 text-xs mt-0.5">
                        {allStudents.find(s => s.id === selectedStudentId)?.name}
                      </div>
                    </div>
                    <span className="bg-primary-100 text-primary-800 font-extrabold text-[9px] px-2.5 py-0.5 rounded-lg">
                      {selectedClass} - {selectedSection}
                    </span>
                  </div>

                  {/* Payment Type Toggle */}
                  <div className="flex bg-slate-105 p-1 rounded-xl shadow-3xs border border-slate-200/40">
                    <button
                      type="button"
                      onClick={() => setPaymentType('INSTALLMENT')}
                      className={`flex-1 text-center py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        paymentType === 'INSTALLMENT' ? 'bg-white text-primary-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Installment Wise
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentType('DIRECT')}
                      className={`flex-1 text-center py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        paymentType === 'DIRECT' ? 'bg-white text-primary-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Direct Payment
                    </button>
                  </div>

                  {paymentType === 'INSTALLMENT' ? (
                    <div className="space-y-4">
                      {/* Installment selection buttons */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase block">Select Installment *</label>
                        <div className="grid grid-cols-3 gap-3">
                          {['INSTALLMENT_1', 'INSTALLMENT_2', 'INSTALLMENT_3'].map((code, index) => {
                            const isSelected = selectedInstallment === code;
                            const status = getInstallmentStatus(code);

                            return (
                              <button
                                key={code}
                                type="button"
                                onClick={() => setSelectedInstallment(code as any)}
                                className={`p-3 border rounded-xl flex flex-col items-center gap-1 cursor-pointer transition-all hover:bg-white/85 ${
                                  isSelected ? 'border-primary-500 bg-blue-50/10 shadow-3xs' : 'border-slate-200 bg-white'
                                }`}
                              >
                                <span className="font-bold text-slate-800 text-xs">Installment {index + 1}</span>
                                <span className={`px-2 py-0.5 rounded-md font-bold text-[8px] uppercase ${
                                  status === 'Paid' ? 'bg-emerald-50 border border-emerald-100 text-emerald-700' :
                                  status === 'Partial' ? 'bg-amber-50 border border-amber-100 text-amber-700' :
                                  'bg-rose-50 border border-rose-100 text-rose-700'
                                }`}>
                                  {status}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Payment Inputs */}
                      <div className="border-t border-slate-100 pt-4 space-y-4">
                        <h4 className="font-bold text-[10px] uppercase tracking-wider text-slate-400 block">Payment Inputs</h4>
                        
                        {!existingRecordForSelected ? (
                          <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Total Installment Fee Amount *</label>
                                <input
                                  type="number"
                                  required
                                  placeholder="Enter total fee for this installment"
                                  value={totalInstallmentAmount}
                                  onChange={(e) => handleTotalAmountChange(e.target.value)}
                                  className="block w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-hidden"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Amount being paid *</label>
                                <input
                                  type="number"
                                  required
                                  placeholder="Enter amount received"
                                  value={amountReceived}
                                  onChange={(e) => setAmountReceived(e.target.value)}
                                  className="block w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-hidden"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Mode of payment *</label>
                                <select
                                  value={paymentMode}
                                  onChange={(e) => setPaymentMode(e.target.value)}
                                  className="block w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 cursor-pointer focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-hidden"
                                >
                                  <option value="Cash">Cash</option>
                                  <option value="UPI">UPI</option>
                                  <option value="Bank Transfer">Bank Transfer</option>
                                  <option value="Cheque">Cheque</option>
                                </select>
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Received date *</label>
                                <input
                                  type="date"
                                  value={receivedDate}
                                  onChange={(e) => setReceivedDate(e.target.value)}
                                  className="block w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-hidden text-slate-700 cursor-pointer"
                                />
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-[11px] text-blue-800 space-y-1">
                              <span className="block font-bold uppercase text-[9px] tracking-wider text-blue-500">Active Installment Ledger</span>
                              <div className="flex justify-between">
                                <span>Total Installment Fee:</span>
                                <span className="font-bold">{formatCurrency(existingRecordForSelected.amount)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Paid so far:</span>
                                <span className="font-bold text-emerald-700">{formatCurrency(existingRecordForSelected.paidAmount)}</span>
                              </div>
                              <div className="flex justify-between border-t border-blue-200/50 pt-1 mt-1 font-extrabold">
                                <span>Remaining Balance to pay:</span>
                                <span className="text-rose-600">{formatCurrency(existingRecordForSelected.balance)}</span>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Amount being paid *</label>
                                <input
                                  type="number"
                                  required
                                  placeholder="Enter amount received"
                                  value={amountReceived}
                                  onChange={(e) => setAmountReceived(e.target.value)}
                                  className="block w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-hidden"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Mode of payment *</label>
                                <select
                                  value={paymentMode}
                                  onChange={(e) => setPaymentMode(e.target.value)}
                                  className="block w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 cursor-pointer focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-hidden"
                                >
                                  <option value="Cash">Cash</option>
                                  <option value="UPI">UPI</option>
                                  <option value="Bank Transfer">Bank Transfer</option>
                                  <option value="Cheque">Cheque</option>
                                </select>
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Received date *</label>
                                <input
                                  type="date"
                                  value={receivedDate}
                                  onChange={(e) => setReceivedDate(e.target.value)}
                                  className="block w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-hidden text-slate-700 cursor-pointer"
                                />
                              </div>
                            </div>
                          </>
                        )}

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Remarks / Notes</label>
                          <input
                            type="text"
                            placeholder="Enter remarks (e.g. check number, bank transfer details)"
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            className="block w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-hidden"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Month selection grid */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase block">Select Month *</label>
                        <div className="grid grid-cols-4 gap-2">
                          {['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'].map((code) => {
                            const isSelected = selectedMonth === code;
                            const status = getMonthStatus(code);

                            return (
                              <button
                                key={code}
                                type="button"
                                onClick={() => setSelectedMonth(code)}
                                className={`p-2 border rounded-xl flex flex-col items-center gap-1 cursor-pointer transition-all hover:bg-white/85 ${
                                  isSelected ? 'border-primary-500 bg-blue-50/10 shadow-3xs' : 'border-slate-200 bg-white'
                                }`}
                              >
                                <span className="font-bold text-slate-800 text-[11px]">{MONTH_NAMES[code]}</span>
                                <span className={`px-1.5 py-0.5 rounded-md font-bold text-[8px] uppercase ${
                                  status === 'Paid' ? 'bg-emerald-50 border border-emerald-100 text-emerald-700' :
                                  status === 'Partial' ? 'bg-amber-50 border border-amber-100 text-amber-700' :
                                  'bg-slate-50 border border-slate-150 text-slate-650'
                                }`}>
                                  {status}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Payment Inputs */}
                      <div className="border-t border-slate-100 pt-4 space-y-4">
                        <h4 className="font-bold text-[10px] uppercase tracking-wider text-slate-400 block">Payment Inputs</h4>
                        
                        {!existingRecordForSelectedMonth ? (
                          <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Total Monthly Fee Amount *</label>
                                <input
                                  type="number"
                                  required
                                  placeholder="Enter total fee for this month"
                                  value={totalMonthAmount}
                                  onChange={(e) => handleTotalMonthAmountChange(e.target.value)}
                                  className="block w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-hidden"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Amount being paid *</label>
                                <input
                                  type="number"
                                  required
                                  placeholder="Enter amount received"
                                  value={amountReceived}
                                  onChange={(e) => setAmountReceived(e.target.value)}
                                  className="block w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-hidden"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Mode of payment *</label>
                                <select
                                  value={paymentMode}
                                  onChange={(e) => setPaymentMode(e.target.value)}
                                  className="block w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 cursor-pointer focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-hidden"
                                >
                                  <option value="Cash">Cash</option>
                                  <option value="UPI">UPI</option>
                                  <option value="Bank Transfer">Bank Transfer</option>
                                  <option value="Cheque">Cheque</option>
                                </select>
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Received date *</label>
                                <input
                                  type="date"
                                  value={receivedDate}
                                  onChange={(e) => setReceivedDate(e.target.value)}
                                  className="block w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-hidden text-slate-700 cursor-pointer"
                                />
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-[11px] text-blue-800 space-y-1">
                              <span className="block font-bold uppercase text-[9px] tracking-wider text-blue-500">Active Monthly Ledger</span>
                              <div className="flex justify-between">
                                <span>Total Monthly Fee:</span>
                                <span className="font-bold">{formatCurrency(existingRecordForSelectedMonth.amount)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Paid so far:</span>
                                <span className="font-bold text-emerald-700">{formatCurrency(existingRecordForSelectedMonth.paidAmount)}</span>
                              </div>
                              <div className="flex justify-between border-t border-blue-200/50 pt-1 mt-1 font-extrabold">
                                <span>Remaining Balance to pay:</span>
                                <span className="text-rose-600">{formatCurrency(existingRecordForSelectedMonth.balance)}</span>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Amount being paid *</label>
                                <input
                                  type="number"
                                  required
                                  placeholder="Enter amount received"
                                  value={amountReceived}
                                  onChange={(e) => setAmountReceived(e.target.value)}
                                  className="block w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-hidden"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Mode of payment *</label>
                                <select
                                  value={paymentMode}
                                  onChange={(e) => setPaymentMode(e.target.value)}
                                  className="block w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 cursor-pointer focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-hidden"
                                >
                                  <option value="Cash">Cash</option>
                                  <option value="UPI">UPI</option>
                                  <option value="Bank Transfer">Bank Transfer</option>
                                  <option value="Cheque">Cheque</option>
                                </select>
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Received date *</label>
                                <input
                                  type="date"
                                  value={receivedDate}
                                  onChange={(e) => setReceivedDate(e.target.value)}
                                  className="block w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-hidden text-slate-700 cursor-pointer"
                                />
                              </div>
                            </div>
                          </>
                        )}

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Remarks / Notes</label>
                          <input
                            type="text"
                            placeholder="Enter remarks (e.g. check number, bank transfer details)"
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            className="block w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-hidden"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer actions */}
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2 shrink-0">
              {formStep === 1 ? (
                <>
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={selectedStudentId === ''}
                    onClick={() => setFormStep(2)}
                    className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold shadow-md shadow-primary-200 transition-all cursor-pointer disabled:bg-slate-100 disabled:text-slate-450 disabled:shadow-none"
                  >
                    Continue
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setFormStep(1)}
                    className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleSavePayment}
                    disabled={savingPayment}
                    className="flex items-center justify-center gap-2 px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold shadow-md shadow-primary-200 transition-all cursor-pointer min-w-[120px] disabled:bg-primary-400"
                  >
                    {savingPayment ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Payment'
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 3: EDIT FEE RECORD --- */}
      {showEditModal && editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-100 w-full max-w-md rounded-3xl shadow-2xl flex flex-col max-h-[90vh] animate-slide-in">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h3 className="font-extrabold text-slate-800 text-sm md:text-base flex items-center gap-2">
                <Edit2 className="h-5 w-5 text-primary-500" />
                Edit Fee Record
              </h3>
              <button 
                onClick={() => {
                  setShowEditModal(false);
                  setEditingRecord(null);
                }} 
                className="text-slate-400 hover:text-slate-600 font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs font-medium text-slate-700">
              <div className="bg-slate-50 p-4 border border-slate-200/50 rounded-2xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-400 uppercase font-black">Student Name</span>
                  <span className="font-bold text-slate-800">{editingRecord.student?.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-400 uppercase font-black">Class & Section</span>
                  <span className="font-bold text-slate-800">
                    {editingRecord.student?.class} - {editingRecord.student?.section}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-400 uppercase font-black">Installment Component</span>
                  <span className="font-bold text-primary-600 uppercase">{editingRecord.componentName || 'School Fee'}</span>
                </div>
              </div>

              {/* Fee Amount */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Total Fee Amount *</label>
                <input
                  type="number"
                  required
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="block w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-hidden"
                />
              </div>

              {/* Paid Amount */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Paid Amount *</label>
                <input
                  type="number"
                  required
                  value={editPaidAmount}
                  onChange={(e) => setEditPaidAmount(e.target.value)}
                  className="block w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-hidden"
                />
              </div>

              {/* Payment Method */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Payment Method</label>
                <select
                  value={editPaymentMethod}
                  onChange={(e) => setEditPaymentMethod(e.target.value)}
                  className="block w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 cursor-pointer focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-hidden"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              {/* Remarks */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Remarks / Notes</label>
                <input
                  type="text"
                  value={editRemarks}
                  onChange={(e) => setEditRemarks(e.target.value)}
                  className="block w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-hidden"
                  placeholder="e.g. check number, correction details"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingRecord(null);
                }}
                className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={submittingEdit}
                className="flex items-center justify-center gap-2 px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold shadow-md shadow-primary-200 transition-all cursor-pointer min-w-[120px] disabled:bg-primary-400"
              >
                {submittingEdit ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
