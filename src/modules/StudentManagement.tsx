'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSearchParams } from 'next/navigation';
import {
  Users,
  Search,
  Filter,
  PlusCircle,
  Edit2,
  Trash2,
  Eye,
  Download,
  Upload,
  UserPlus,
  X,
  FileSpreadsheet,
  AlertTriangle,
  Loader2,
  MapPin,
  Phone,
  Mail,
  UserCheck
} from 'lucide-react';
import Papa from 'papaparse';

interface Student {
  id: string;
  admissionNumber: string;
  name: string;
  class: string;
  section: string;
  parentName: string;
  parentPhone: string;
  parentEmail?: string;
  address: string;
  emergencyContact: string;
  profileImage?: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'GRADUATED';
  dateOfBirth?: string;
  dateOfAdmission?: string;
  motherName?: string;
  dateOfDeactivation?: string;
}

type StudentImportRow = Record<string, unknown>;

const REQUIRED_IMPORT_HEADERS = 'name, class, section, parentName, parentPhone, address, emergencyContact';

const normalizeHeader = (header: string) => header.toLowerCase().replace(/[^a-z0-9]/g, '');

const getImportValue = (row: StudentImportRow, aliases: string[]) => {
  const normalizedAliases = aliases.map(normalizeHeader);
  const match = Object.entries(row).find(([key]) => normalizedAliases.includes(normalizeHeader(key)));
  const value = match?.[1];
  return value === undefined || value === null ? '' : String(value).trim();
};

const normalizePhone = (value: string) => {
  if (!value) return '';
  const digits = value.replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : digits;
};

const normalizeClassName = (value: string) => {
  const clean = value.trim();
  if (!clean) return 'Class 7';
  const numberOnly = clean.match(/\d+/)?.[0];
  return numberOnly ? `Class ${numberOnly}` : clean;
};

const normalizeSection = (value: string) => {
  const clean = value.trim();
  return clean ? clean.charAt(0).toUpperCase() : 'A';
};

const normalizeDateValue = (value: string) => {
  if (!value) return '';
  
  // Handle Excel numeric date serials
  const num = Number(value);
  if (!Number.isNaN(num) && num > 0 && num < 100000 && String(value).trim() !== '') {
    // Excel dates are days since 1899-12-30 (due to 1900 leap year bug in Excel)
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const msPerDay = 24 * 60 * 60 * 1000;
    const parsed = new Date(excelEpoch.getTime() + num * msPerDay);
    return parsed.toISOString().split('T')[0];
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    // Handle DD/MM/YYYY format
    const parts = String(value).split('/');
    if (parts.length === 3) {
      const day = parts[0].trim();
      const month = parts[1].trim();
      const year = parts[2].trim();
      if (day.length <= 2 && month.length <= 2 && year.length === 4) {
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    }
    return value;
  }
  return parsed.toISOString().split('T')[0];
};

const normalizeEmail = (value: string) => {
  if (!value) return '';
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? value : '';
};

const buildStudentImportPayload = (row: StudentImportRow) => {
  const name = getImportValue(row, [
    'Name', 'Student Name', 'Student', 'Full Name', 'StudentName', 
    'Name of Student', 'Name of the Student', 'Student Name *', 'Name *', 'NameofStudent',
    'Students Name', "Student's Name", 'StudentsName'
  ]);
  if (!name) return null;

  const parentPhoneRaw = getImportValue(row, [
    'Parent Phone', 'Father Phone', 'Guardian Phone', 'Mobile', 'Phone', 'parentPhone', 
    'Mobile No', 'Mobile Number', 'Phone Number', 'Contact No', 'Contact Number', 'MobileNo', 'ContactNo',
    'Cont', 'Contact', 'ContNo', 'Cont No', 'Contact no.', 'Contact no. 1', 'Contact no. 2',
    'Contact no 1', 'Contact no 2', 'Contact 1', 'Contact 2', 'ContactNo1', 'ContactNo2'
  ]);
  const emergencyContactRaw = getImportValue(row, [
    'Emergency Phone', 'Emergency Contact', 'Emergency Mobile', 'emergencyContact', 
    'Emergency Contact No', 'Emergency Contact Number', 'Emergency Mobile No', 'EmergencyContact'
  ]);
  
  const parentPhone = normalizePhone(parentPhoneRaw);
  const emergencyContact = normalizePhone(emergencyContactRaw);
  
  const parentName = getImportValue(row, [
    'Parent Name', 'Father Name', 'Guardian Name', 'parentName', 'FatherName', 
    "Father's Name", 'Father Name *', "Father's Name *", 'FatherName*'
  ]);
  const address = getImportValue(row, [
    'Address', 'Residential Address', 'Home Address', 'address', 'Address *', 'Res Address'
  ]);

  return {
    admissionNumber: getImportValue(row, [
      'Admission Number', 'Admission No', 'Adm No', 'Admission ID', 'admissionNumber', 
      'AdmNo', 'AdmissionNumber', 'AdmissionNo', 'SRN', 'SRN No'
    ]) || undefined,
    name,
    class: normalizeClassName(getImportValue(row, ['Class', 'Grade', 'Standard', 'class', 'Class *', 'Grade *'])),
    section: normalizeSection(getImportValue(row, ['Section', 'Sec', 'section', 'Section *'])),
    parentName,
    parentPhone,
    parentEmail: normalizeEmail(getImportValue(row, [
      'Parent Email', 'Guardian Email', 'Email', 'parentEmail', 'Email ID', 'EmailID', 'Email Address'
    ])) || undefined,
    address,
    emergencyContact,
    dateOfBirth: normalizeDateValue(getImportValue(row, [
      'Date of Birth', 'DOB', 'Birth Date', 'dateOfBirth', 'DOB *', 'DateofBirth'
    ])) || undefined,
    dateOfAdmission: normalizeDateValue(getImportValue(row, [
      'Date of Admission', 'Admission Date', 'DOA', 'dateOfAdmission', 'DateofAdmission'
    ])) || undefined,
    motherName: getImportValue(row, [
      'Mother Name', 'Mother', 'motherName', "Mother's Name", "Mother's Name *"
    ]) || undefined,
    dateOfDeactivation: normalizeDateValue(getImportValue(row, [
      'Date of Deactivation', 'Deactivation Date', 'dateOfDeactivation', 'DeactivationDate'
    ])) || undefined
  };
};

export default function StudentManagement() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const autoOpenAdd = searchParams.get('action') === 'add';

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Modal control states
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  
  // Active states for editing or viewing
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    class: 'Class 7',
    section: 'A',
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    address: '',
    emergencyContact: '',
    dateOfBirth: '',
    dateOfAdmission: '',
    motherName: '',
    dateOfDeactivation: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Bulk Upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    setSelectedIds([]);
  }, [students]);

  // Fetch students on load
  const loadStudents = async () => {
    setLoading(true);
    try {
      const qParams = new URLSearchParams();
      if (classFilter) qParams.set('class', classFilter);
      if (searchQuery) qParams.set('search', searchQuery);

      const res = await fetch(`/api/students?${qParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setStudents(data);
      } else {
        showToast('Failed to load students', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Connection error', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, [classFilter, searchQuery]);

  // Open add student form directly if triggered by dashboard quick link
  useEffect(() => {
    if (autoOpenAdd) {
      handleOpenAddModal();
    }
  }, [autoOpenAdd]);

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Open modals
  const handleOpenAddModal = () => {
    setCurrentStudent(null);
    setFormData({
      name: '',
      class: 'Class 7',
      section: 'A',
      parentName: '',
      parentPhone: '',
      parentEmail: '',
      address: '',
      emergencyContact: '',
      dateOfBirth: '',
      dateOfAdmission: '',
      motherName: '',
      dateOfDeactivation: ''
    });
    setFormErrors({});
    setFormModalOpen(true);
  };

  const handleOpenEditModal = (student: Student) => {
    setCurrentStudent(student);
    setFormData({
      name: student.name,
      class: student.class,
      section: student.section,
      parentName: student.parentName,
      parentPhone: student.parentPhone,
      parentEmail: student.parentEmail || '',
      address: student.address,
      emergencyContact: student.emergencyContact,
      dateOfBirth: student.dateOfBirth || '',
      dateOfAdmission: student.dateOfAdmission || '',
      motherName: student.motherName || '',
      dateOfDeactivation: student.dateOfDeactivation || ''
    });
    setFormErrors({});
    setFormModalOpen(true);
  };

  const handleOpenProfileModal = (student: Student) => {
    setSelectedStudent(student);
    setProfileModalOpen(true);
  };

  // Form Submission
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    // Validate client-side
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.parentName.trim()) errors.parentName = 'Parent name is required';
    if (!/^\d{10}$/.test(formData.parentPhone)) errors.parentPhone = 'Must be exactly 10 digits';
    if (!formData.address.trim()) errors.address = 'Address is required';
    if (!/^\d{10}$/.test(formData.emergencyContact)) errors.emergencyContact = 'Must be exactly 10 digits';
    if (formData.parentEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.parentEmail)) {
      errors.parentEmail = 'Invalid email address';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormSubmitting(true);

    try {
      const url = currentStudent ? `/api/students/${currentStudent.id}` : '/api/students';
      const method = currentStudent ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        showToast(
          currentStudent ? 'Student details updated successfully' : 'Student admitted successfully',
          'success'
        );
        setFormModalOpen(false);
        loadStudents();
      } else {
        if (data.fields) {
          setFormErrors(data.fields);
        } else {
          showToast(data.error || 'Operation failed', 'error');
        }
      }
    } catch (e) {
      console.error(e);
      showToast('Server communication failure', 'error');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Delete Student
  const handleDeleteStudent = async (student: Student) => {
    if (!confirm(`Are you absolutely sure you want to permanently delete student ${student.name} (${student.admissionNumber})? This will delete all fee history and attendance.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/students/${student.id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Student successfully removed', 'success');
        loadStudents();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to delete student', 'error');
      }
    } catch (e) {
      showToast('Connection failed', 'error');
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(students.map(s => s.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (studentId: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, studentId]);
    } else {
      setSelectedIds(prev => prev.filter(id => id !== studentId));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you absolutely sure you want to permanently delete the ${selectedIds.length} selected students? This will delete all their records, attendance, and fee history.`)) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/students', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      });
      if (res.ok) {
        showToast(`Successfully removed ${selectedIds.length} students`, 'success');
        setSelectedIds([]);
        loadStudents();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to delete students', 'error');
      }
    } catch (e) {
      showToast('Connection failed during bulk deletion', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (students.length === 0) {
      showToast('No student data to export', 'info');
      return;
    }

    const csvData = students.map(s => ({
      'Admission Number': s.admissionNumber,
      'Name': s.name,
      'Class': s.class,
      'Section': s.section,
      'Parent Name': s.parentName,
      'Parent Phone': s.parentPhone,
      'Parent Email': s.parentEmail || '',
      'Emergency Phone': s.emergencyContact,
      'Address': s.address,
      'Status': s.status,
      'Mother Name': s.motherName || '',
      'Date of Birth': s.dateOfBirth || '',
      'Date of Admission': s.dateOfAdmission || '',
      'Date of Deactivation': s.dateOfDeactivation || ''
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `AWS_Students_Report_${new Date().getFullYear()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Student list exported successfully', 'success');
  };

  // Handle Bulk CSV Upload
  const handleBulkUploadClick = () => {
    setImportModalOpen(true);
  };

  const importStudentRows = async (rows: StudentImportRow[]) => {
    let successCount = 0;
    let failCount = 0;
    let skippedCount = 0;

    for (const row of rows) {
      // Skip empty rows
      if (!row || Object.keys(row).every(key => !row[key])) {
        skippedCount++;
        continue;
      }

      const payload = buildStudentImportPayload(row);
      if (!payload) {
        skippedCount++;
        continue;
      }

      try {
        const res = await fetch('/api/students', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        
        if (res.ok) {
          successCount++;
        } else {
          const errorData = await res.json();
          console.error('Student import failed:', payload.name, errorData);
          failCount++;
        }
      } catch (error) {
        console.error('Network error importing student:', payload.name, error);
        failCount++;
      }
    }

    const message = `Import complete: ${successCount} added${skippedCount > 0 ? `, ${skippedCount} skipped` : ''}${failCount > 0 ? `, ${failCount} failed` : ''}`;
    showToast(message, failCount > 0 ? 'info' : 'success');
    setImporting(false);
    setImportModalOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    loadStudents();
  };

  const processFile = async (file: File) => {
    setImporting(true);
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (extension !== 'xlsx') {
      showToast('Only XLSX files are supported', 'error');
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      const XLSX = await import('xlsx');
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
      
      if (!workbook.SheetNames.length) {
        showToast('XLSX file has no sheets', 'error');
        setImporting(false);
        return;
      }
      
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const range = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, defval: '' });
      
      if (!range || range.length === 0) {
        showToast('No data found in XLSX file', 'error');
        setImporting(false);
        return;
      }

      // Detect header row helper
      const isHeaderRow = (row: any[]) => {
        if (!row || row.length === 0) return false;
        const headersLower = row.map(cell => 
          cell === null || cell === undefined ? '' : String(cell).toLowerCase().trim().replace(/[^a-z]/g, '')
        );
        
        const hasSrNo = headersLower.some(h => h === 'srno' || h === 'sno' || h === 'sr' || h === 'serialno');
        const hasStudent = headersLower.some(h => 
          h === 'studentname' || h === 'studentsname' || h === 'nameofstudent' || h === 'student' || h === 'name'
        );
        const hasFather = headersLower.some(h => 
          h === 'fathername' || h === 'fathersname' || h === 'parentname' || h === 'father'
        );
        
        return (hasSrNo && hasStudent) || (hasStudent && hasFather);
      };

      let activeHeaders: string[] | null = null;
      const jsonData: StudentImportRow[] = [];

      for (let i = 0; i < range.length; i++) {
        const row = range[i];
        if (!row) continue;
        
        if (isHeaderRow(row)) {
          activeHeaders = row.map(h => h === null || h === undefined ? '' : String(h).trim());
          console.log(`Detected new headers at row ${i}:`, activeHeaders);
          continue;
        }
        
        if (!activeHeaders) continue;

        const isEmpty = row.every(cell => 
          cell === null || cell === undefined || String(cell).trim() === ''
        );
        if (isEmpty) continue;

        // Skip section divider titles (usually has only 1 non-empty cell)
        const nonEmptyCells = row.filter(cell => 
          cell !== null && cell !== undefined && String(cell).trim() !== ''
        );
        if (nonEmptyCells.length <= 1) continue;

        const obj: StudentImportRow = {};
        activeHeaders.forEach((header, colIdx) => {
          if (header) {
            obj[header] = row[colIdx] === undefined || row[colIdx] === null ? '' : row[colIdx];
          }
        });
        jsonData.push(obj);
      }
      
      console.log(`Multi-section parser found ${jsonData.length} mapped rows.`);
      
      if (jsonData && jsonData.length > 0) {
        await importStudentRows(jsonData);
      } else {
        showToast('No valid data rows found in XLSX file', 'error');
        setImporting(false);
      }
    } catch (error: any) {
      console.error('XLSX Parse Error:', error);
      showToast('Error parsing XLSX file: ' + (error.message || 'Unknown error'), 'error');
      setImporting(false);
    }
  };

  const handleSpreadsheetImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
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

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 border border-slate-100 rounded-3xl shadow-xs">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-primary-500" />
            Student Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">Manage, search, and register student admission profile logs</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {selectedIds.length > 0 && user?.role === 'ADMIN' && (
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 rounded-xl text-xs font-semibold text-white cursor-pointer shadow-md shadow-rose-200 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Delete Selected ({selectedIds.length})
            </button>
          )}

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer transition-colors"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          
          {hasWriteAccess && (
            <>
              <button
                onClick={handleBulkUploadClick}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer transition-colors"
              >
                <Upload className="h-4 w-4" />
                Bulk Import
              </button>
              
              <button
                onClick={handleOpenAddModal}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 rounded-xl text-xs font-semibold text-white cursor-pointer shadow-md shadow-primary-200 transition-colors"
              >
                <UserPlus className="h-4 w-4" />
                Add Student
              </button>
            </>
          )}
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 border border-slate-100 rounded-2xl shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80 shadow-xs">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Search by Name or Adm No..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-primary-500 focus:bg-white text-xs transition-all"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto shrink-0 justify-end">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1 text-slate-500">
            <Filter className="h-3.5 w-3.5" />
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 outline-hidden cursor-pointer"
            >
              <option value="">All Classes</option>
              <option value="Class 5">Class 5</option>
              <option value="Class 6">Class 6</option>
              <option value="Class 7">Class 7</option>
              <option value="Class 8">Class 8</option>
            </select>
          </div>
        </div>
      </div>

      {/* Database Student List table */}
      <div className="bg-white border border-slate-100 rounded-3xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
            <span className="text-xs text-slate-400 font-bold">Refreshing student records...</span>
          </div>
        ) : students.length === 0 ? (
          <div className="p-16 text-center text-slate-400 flex flex-col items-center gap-3">
            <Users className="h-10 w-10 text-slate-300" />
            <div>
              <h3 className="font-bold text-slate-700 text-sm">No Student Records</h3>
              <p className="text-xs text-slate-400 mt-1">Try tweaking filters or add a new student profile</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-slate-400 font-bold uppercase tracking-wider">
                  {user?.role === 'ADMIN' && (
                    <th className="px-6 py-4 w-10">
                      <input
                        type="checkbox"
                        checked={students.length > 0 && selectedIds.length === students.length}
                        onChange={handleSelectAll}
                        className="h-4 w-4 rounded-sm border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                      />
                    </th>
                  )}
                  <th className="px-6 py-4">Student Name</th>
                  <th className="px-6 py-4">Admission No.</th>
                  <th className="px-6 py-4">Class & Sec</th>
                  <th className="px-6 py-4">Parent Details</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/75 transition-colors">
                    {user?.role === 'ADMIN' && (
                      <td className="px-6 py-4 w-10">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(student.id)}
                          onChange={(e) => handleSelectRow(student.id, e.target.checked)}
                          className="h-4 w-4 rounded-sm border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                        />
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-slate-100 rounded-full flex items-center justify-center font-bold text-primary-600 border border-slate-200">
                          {student.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-extrabold text-slate-800 block">{student.name}</span>
                          <span className="text-[10px] text-slate-400">ID: {student.id.substring(0, 8)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800 tracking-tight">
                      {student.admissionNumber}
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg font-bold">
                        {student.class}-{student.section}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="leading-normal">
                        <div className="font-semibold text-slate-700">{student.parentName}</div>
                        <div className="text-[10px] text-slate-400">{student.parentPhone}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                        student.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' :
                        student.status === 'SUSPENDED' ? 'bg-rose-100 text-rose-800' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {student.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex gap-1.5 justify-end">
                        <button
                          onClick={() => handleOpenProfileModal(student)}
                          className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600 cursor-pointer transition-colors"
                          title="View Profile"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        
                        {hasWriteAccess && (
                          <button
                            onClick={() => handleOpenEditModal(student)}
                            className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-primary-600 cursor-pointer transition-colors"
                            title="Edit details"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                        )}

                        {user?.role === 'ADMIN' && (
                          <button
                            onClick={() => handleDeleteStudent(student)}
                            className="p-2 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-100 rounded-lg text-rose-600 cursor-pointer transition-colors"
                            title="Delete Student"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
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

      {/* --- ADD/EDIT MODAL DIALOG --- */}
      {formModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-100 w-full max-w-xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] animate-slide-in">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h3 className="font-extrabold text-slate-800 text-sm md:text-base flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary-500" />
                {currentStudent ? `Edit Student: ${currentStudent.name}` : 'Register New Student Admission'}
              </h3>
              <button onClick={() => setFormModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold p-1">✕</button>
            </div>
            
            {/* Modal Form Scroll Area */}
            <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Student Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Student Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="block w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-hidden"
                    placeholder="Aarav Sharma"
                  />
                  {formErrors.name && <span className="text-[10px] text-red-500 font-semibold">{formErrors.name}</span>}
                </div>

                {/* Class */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Class</label>
                  <select
                    value={formData.class}
                    onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                    className="block w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs bg-slate-50 cursor-pointer focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-hidden"
                  >
                    <option value="Class 5">Class 5</option>
                    <option value="Class 6">Class 6</option>
                    <option value="Class 7">Class 7</option>
                    <option value="Class 8">Class 8</option>
                  </select>
                </div>

                {/* Section */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Section</label>
                  <select
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    className="block w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs bg-slate-50 cursor-pointer focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-hidden"
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                  </select>
                </div>

                {/* Parent Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Parent Name</label>
                  <input
                    type="text"
                    required
                    value={formData.parentName}
                    onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                    className="block w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-hidden"
                    placeholder="Ramesh Sharma"
                  />
                  {formErrors.parentName && <span className="text-[10px] text-red-500 font-semibold">{formErrors.parentName}</span>}
                </div>

                {/* Parent Phone */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Parent Phone</label>
                  <input
                    type="text"
                    required
                    value={formData.parentPhone}
                    onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                    className="block w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-hidden"
                    placeholder="9876543210"
                  />
                  {formErrors.parentPhone && <span className="text-[10px] text-red-500 font-semibold">{formErrors.parentPhone}</span>}
                </div>

                {/* Parent Email */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Parent Email (Optional)</label>
                  <input
                    type="email"
                    value={formData.parentEmail}
                    onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
                    className="block w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-hidden"
                    placeholder="parent@example.com"
                  />
                  {formErrors.parentEmail && <span className="text-[10px] text-red-500 font-semibold">{formErrors.parentEmail}</span>}
                </div>

                {/* Emergency Contact */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Emergency Contact No.</label>
                  <input
                    type="text"
                    required
                    value={formData.emergencyContact}
                    onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                    className="block w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-hidden"
                    placeholder="9876543211"
                  />
                  {formErrors.emergencyContact && <span className="text-[10px] text-red-500 font-semibold">{formErrors.emergencyContact}</span>}
                </div>

                {/* Mother's Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Mother's Name (Optional)</label>
                  <input
                    type="text"
                    value={formData.motherName}
                    onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                    className="block w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-hidden"
                    placeholder="Sita Sharma"
                  />
                </div>

                {/* Date of Birth */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Date of Birth (Optional)</label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="block w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-hidden text-slate-700"
                  />
                </div>

                {/* Date of Admission */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Date of Admission (Optional)</label>
                  <input
                    type="date"
                    value={formData.dateOfAdmission}
                    onChange={(e) => setFormData({ ...formData, dateOfAdmission: e.target.value })}
                    className="block w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-hidden text-slate-700"
                  />
                </div>

                {/* Date of Deactivation */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Date of Deactivation (Optional)</label>
                  <input
                    type="date"
                    value={formData.dateOfDeactivation}
                    onChange={(e) => setFormData({ ...formData, dateOfDeactivation: e.target.value })}
                    className="block w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-hidden text-slate-700"
                  />
                </div>
              </div>

              {/* Address */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Residential Address</label>
                <textarea
                  required
                  rows={3}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="block w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-hidden"
                  placeholder="Sector 15, Panchkula, Haryana..."
                />
                {formErrors.address && <span className="text-[10px] text-red-500 font-semibold">{formErrors.address}</span>}
              </div>

              {/* Modal Footer Actions */}
              <div className="flex gap-2 justify-end border-t border-slate-100 pt-4 shrink-0">
                <button
                  type="button"
                  onClick={() => setFormModalOpen(false)}
                  className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="flex items-center gap-1.5 px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-xl text-xs font-semibold text-white shadow-md cursor-pointer disabled:bg-primary-400"
                >
                  {formSubmitting ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Profile'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- PROFILE DETAIL MODAL PANEL --- */}
      {profileModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-100 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-slide-in">
            <div className="bg-primary-600 p-6 text-white text-center relative">
              <button
                onClick={() => setProfileModalOpen(false)}
                className="absolute top-4 right-4 text-white/70 hover:text-white font-bold p-1"
              >
                ✕
              </button>
              <div className="h-16 w-16 bg-white/20 border border-white/30 rounded-full mx-auto flex items-center justify-center text-white font-black text-2xl mb-3 shadow-md">
                {selectedStudent.name.substring(0, 2).toUpperCase()}
              </div>
              <h3 className="font-extrabold text-lg">{selectedStudent.name}</h3>
              <p className="text-xs text-white/80 mt-0.5">Adm No: {selectedStudent.admissionNumber}</p>
              <span className="inline-block mt-2 text-[10px] bg-emerald-500 text-white font-bold px-3 py-1 rounded-full uppercase">
                {selectedStudent.status}
              </span>
            </div>

            <div className="p-6 space-y-4 text-xs font-medium text-slate-700">
              <div className="grid grid-cols-2 gap-4 pb-3 border-b border-slate-100">
                <div>
                  <span className="block text-[10px] text-slate-400 uppercase font-bold">Class & Section</span>
                  <span className="font-extrabold text-slate-800 text-sm mt-0.5 block">{selectedStudent.class} - {selectedStudent.section}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 uppercase font-bold">Emergency Phone</span>
                  <span className="font-extrabold text-slate-800 text-sm mt-0.5 block flex items-center gap-1">
                    <Phone className="h-3 w-3 text-primary-500" />
                    {selectedStudent.emergencyContact}
                  </span>
                </div>
              </div>

              {/* Secondary academic details */}
              {(selectedStudent.dateOfBirth || selectedStudent.dateOfAdmission) && (
                <div className="grid grid-cols-2 gap-4 pb-3 border-b border-slate-100">
                  <div>
                    <span className="block text-[10px] text-slate-400 uppercase font-bold">Date of Birth</span>
                    <span className="font-bold text-slate-800 block mt-0.5">
                      {selectedStudent.dateOfBirth ? new Date(selectedStudent.dateOfBirth).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 uppercase font-bold">Date of Admission</span>
                    <span className="font-bold text-slate-800 block mt-0.5">
                      {selectedStudent.dateOfAdmission ? new Date(selectedStudent.dateOfAdmission).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-2 border-b border-slate-100 pb-3">
                <span className="block text-[10px] text-slate-400 uppercase font-bold">Parent Details</span>
                <div className="space-y-1.5 leading-normal">
                  <div className="font-bold text-slate-800"><span className="text-slate-400 font-semibold">Father:</span> {selectedStudent.parentName}</div>
                  {selectedStudent.motherName && (
                    <div className="font-bold text-slate-800"><span className="text-slate-400 font-semibold">Mother:</span> {selectedStudent.motherName}</div>
                  )}
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                    {selectedStudent.parentPhone}
                  </div>
                  {selectedStudent.parentEmail && (
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Mail className="h-3 w-3 text-slate-400 shrink-0" />
                      {selectedStudent.parentEmail}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1.5 pb-3 border-b border-slate-100">
                <span className="block text-[10px] text-slate-400 uppercase font-bold">Residential Address</span>
                <div className="flex items-start gap-1.5 text-slate-600 leading-relaxed font-semibold">
                  <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                  {selectedStudent.address}
                </div>
              </div>

              {selectedStudent.dateOfDeactivation && (
                <div className="bg-rose-50 border border-rose-100 p-2.5 rounded-xl text-rose-800 text-[10px] font-bold leading-normal">
                  ⚠️ Deactivated on: {new Date(selectedStudent.dateOfDeactivation).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setProfileModalOpen(false)}
                  className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer"
                >
                  Close Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- BULK IMPORT MODAL DIALOG --- */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-100 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-slide-in">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h3 className="font-extrabold text-slate-800 text-sm md:text-base flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-primary-500" />
                Bulk Student Import
              </h3>
              <button onClick={() => setImportModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold p-1">✕</button>
            </div>
            
            <div className="p-6 space-y-4 text-xs font-medium text-slate-600">
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-8 border-2 border-dashed rounded-2xl text-center space-y-3 cursor-pointer transition-all duration-200 ${
                  isDragging
                    ? 'border-primary-500 bg-primary-50/50 shadow-md scale-[0.98]'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100/70 hover:border-slate-300'
                }`}
              >
                <div className={`mx-auto h-12 w-12 rounded-2xl flex items-center justify-center transition-colors duration-200 ${
                  isDragging ? 'bg-primary-100 text-primary-600' : 'bg-white text-slate-400 border border-slate-100 shadow-xs'
                }`}>
                  <Upload className={`h-6 w-6 ${isDragging ? 'animate-bounce' : ''}`} />
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-slate-700 text-sm">
                    {isDragging ? 'Drop XLSX file here' : 'Drag & drop your XLSX file'}
                  </p>
                  <p className="text-[10px] text-slate-400">or click to browse from device</p>
                </div>
              </div>

              <div className="bg-amber-50/75 p-3.5 border border-amber-100 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-2 text-amber-800 font-bold">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>Important Instructions</span>
                </div>
                <p className="text-[10px] text-amber-700/90 leading-relaxed">
                  Only <strong>.xlsx</strong> files are supported. Missing optional fields will automatically be placed as blanks in ERP, and rows without a student name are skipped.<br />
                  Required header fields: <span className="font-mono text-primary-600 font-bold block mt-1">{REQUIRED_IMPORT_HEADERS}</span>
                </p>
              </div>

              <input
                type="file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={handleSpreadsheetImport}
                ref={fileInputRef}
                disabled={importing}
                className="hidden"
              />

              {importing && (
                <div className="flex items-center justify-center gap-2.5 text-primary-600 font-bold mt-2 bg-primary-50/50 py-3 rounded-2xl border border-primary-100 animate-pulse">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Parsing spreadsheet, registering students...
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setImportModalOpen(false)}
                  className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
