'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  Contact,
  Users,
  Search,
  PlusCircle,
  Edit2,
  Trash2,
  Lock,
  Loader2,
  Sparkles,
  ClipboardCheck,
  Award,
  BookOpen,
  Briefcase
} from 'lucide-react';

interface Teacher {
  id: string;
  name: string;
  email: string;
  phone: string;
  subjects: string[];
  classes: string[];
}

interface Staff {
  id: string;
  name: string;
  email: string;
  phone: string;
  roleName: string;
  permissions: string[];
}

export default function StaffManagement() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'teachers' | 'staff'>('teachers');
  
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Modal control
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  // Form Fields
  const [teacherFormData, setTeacherFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subjects: '',
    classes: ''
  });

  const [staffFormData, setStaffFormData] = useState({
    name: '',
    email: '',
    phone: '',
    roleName: 'Accountant',
    permissions: [] as string[]
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'teachers') {
        const res = await fetch('/api/teachers');
        if (res.ok) {
          const data = await res.json();
          setTeachers(data);
        }
      } else {
        const res = await fetch('/api/staff');
        if (res.ok) {
          const data = await res.json();
          setStaff(data);
        }
      }
    } catch (e) {
      showToast('Connection failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormErrors({});
    if (activeTab === 'teachers') {
      setTeacherFormData({ name: '', email: '', phone: '', subjects: '', classes: '' });
    } else {
      setStaffFormData({ name: '', email: '', phone: '', roleName: 'Accountant', permissions: ['general_access'] });
    }
    setFormOpen(true);
  };

  const handleOpenEditModal = (item: any) => {
    setEditingItem(item);
    setFormErrors({});
    if (activeTab === 'teachers') {
      setTeacherFormData({
        name: item.name,
        email: item.email,
        phone: item.phone,
        subjects: item.subjects.join(', '),
        classes: item.classes.join(', ')
      });
    } else {
      setStaffFormData({
        name: item.name,
        email: item.email,
        phone: item.phone,
        roleName: item.roleName,
        permissions: item.permissions
      });
    }
    setFormOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    setSubmitting(true);

    const errors: Record<string, string> = {};
    const isEditing = !!editingItem;

    try {
      if (activeTab === 'teachers') {
        // Validate
        if (!teacherFormData.name.trim()) errors.name = 'Name is required';
        if (!teacherFormData.email.trim()) errors.email = 'Email is required';
        if (!/^\d{10}$/.test(teacherFormData.phone)) errors.phone = 'Phone must be exactly 10 digits';
        if (!teacherFormData.subjects.trim()) errors.subjects = 'At least one subject is required';
        if (!teacherFormData.classes.trim()) errors.classes = 'At least one class is required';

        if (Object.keys(errors).length > 0) {
          setFormErrors(errors);
          setSubmitting(false);
          return;
        }

        const payload = {
          name: teacherFormData.name,
          email: teacherFormData.email,
          phone: teacherFormData.phone,
          subjects: teacherFormData.subjects.split(',').map(s => s.trim()).filter(Boolean),
          classes: teacherFormData.classes.split(',').map(c => c.trim()).filter(Boolean)
        };

        const url = isEditing ? `/api/teachers/${editingItem.id}` : '/api/teachers';
        const method = isEditing ? 'PUT' : 'POST';

        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const data = await res.json();
          showToast(isEditing ? 'Teacher updated successfully' : `Teacher registered. Temporary password: ${data.teacher?.temporaryPassword || 'created'}`, 'success');
          setFormOpen(false);
          loadData();
        } else {
          const data = await res.json();
          showToast(data.error || 'Operation failed', 'error');
        }

      } else {
        // Staff validation
        if (!staffFormData.name.trim()) errors.name = 'Name is required';
        if (!staffFormData.email.trim()) errors.email = 'Email is required';
        if (!/^\d{10}$/.test(staffFormData.phone)) errors.phone = 'Phone must be exactly 10 digits';

        if (Object.keys(errors).length > 0) {
          setFormErrors(errors);
          setSubmitting(false);
          return;
        }

        const payload = {
          name: staffFormData.name,
          email: staffFormData.email,
          phone: staffFormData.phone,
          roleName: staffFormData.roleName,
          permissions: staffFormData.permissions.length > 0 ? staffFormData.permissions : ['general_access']
        };

        const url = isEditing ? `/api/staff/${editingItem.id}` : '/api/staff';
        const method = isEditing ? 'PUT' : 'POST';

        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const data = await res.json();
          showToast(isEditing ? 'Staff updated successfully' : `Staff registered. Temporary password: ${data.staff?.temporaryPassword || 'created'}`, 'success');
          setFormOpen(false);
          loadData();
        } else {
          const data = await res.json();
          showToast(data.error || 'Operation failed', 'error');
        }
      }
    } catch (e) {
      showToast('Connection failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item: any) => {
    let confirmed = false;
    try {
      confirmed = window.confirm(`Are you absolutely sure you want to permanently delete ${item.name}? This will remove their dynamic system login access.`);
    } catch (e) {
      console.warn("window.confirm blocked, bypassing confirmation check:", e);
      confirmed = true;
    }

    if (!confirmed) {
      return;
    }

    try {
      const url = activeTab === 'teachers' ? `/api/teachers/${item.id}` : `/api/staff/${item.id}`;
      const res = await fetch(url, { method: 'DELETE' });

      if (res.ok) {
        showToast('Record deleted successfully', 'success');
        loadData();
      } else {
        const data = await res.json();
        showToast(data.error || 'Deletion failed', 'error');
      }
    } catch (e) {
      showToast('Connection error', 'error');
    }
  };

  const handlePermissionCheckbox = (permission: string) => {
    const active = staffFormData.permissions;
    if (active.includes(permission)) {
      setStaffFormData({ ...staffFormData, permissions: active.filter(p => p !== permission) });
    } else {
      setStaffFormData({ ...staffFormData, permissions: [...active, permission] });
    }
  };

  const filteredTeachers = teachers.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.subjects.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredStaff = staff.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.roleName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const hasWriteAccess = user?.role === 'ADMIN';

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
            <Contact className="h-6 w-6 text-primary-500" />
            Human Resources Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">Manage teaching faculties, accountants, and non-teaching support staffs</p>
        </div>
        
        {hasWriteAccess && (
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 rounded-xl text-xs font-semibold text-white cursor-pointer shadow-md shadow-primary-200 transition-colors"
          >
            <PlusCircle className="h-4 w-4" />
            Add {activeTab === 'teachers' ? 'Faculty Member' : 'Support Staff'}
          </button>
        )}
      </div>

      {/* Tab Select & Search Header */}
      <div className="bg-white p-4 border border-slate-100 rounded-2xl shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Tab Headers */}
        <div className="flex bg-slate-100 p-1 border border-slate-200 rounded-xl gap-1 shrink-0 w-full md:w-auto">
          <button
            onClick={() => { setActiveTab('teachers'); setSearchQuery(''); }}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'teachers' ? 'bg-white text-primary-600 shadow-xs' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            Teaching Faculty ({teachers.length})
          </button>
          <button
            onClick={() => { setActiveTab('staff'); setSearchQuery(''); }}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'staff' ? 'bg-white text-primary-600 shadow-xs' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Briefcase className="h-3.5 w-3.5" />
            Administrative & Support ({staff.length})
          </button>
        </div>

        {/* Search bar */}
        <div className="relative w-full md:w-80 shadow-xs">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder={`Search by Name or Email...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-primary-500 focus:bg-white text-xs transition-all"
          />
        </div>
      </div>

      {/* Main Data Tables Container */}
      <div className="bg-white border border-slate-100 rounded-3xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
            <span className="text-xs text-slate-400 font-bold">Retrieving human resource ledger logs...</span>
          </div>
        ) : activeTab === 'teachers' ? (
          /* TEACHERS TABLE */
          filteredTeachers.length === 0 ? (
            <div className="p-16 text-center text-slate-400 flex flex-col items-center gap-3">
              <Users className="h-10 w-10 text-slate-300" />
              <div>
                <h3 className="font-bold text-slate-700 text-sm">No Teachers Found</h3>
                <p className="text-xs text-slate-400 mt-1">Try tweaking filters or look for another name</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="px-6 py-4">Faculty Name</th>
                    <th className="px-6 py-4">Email Address</th>
                    <th className="px-6 py-4">Phone No.</th>
                    <th className="px-6 py-4">Subjects Taught</th>
                    <th className="px-6 py-4">Assigned Classes</th>
                    {hasWriteAccess && <th className="px-6 py-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                  {filteredTeachers.map((teacher) => (
                    <tr key={teacher.id} className="hover:bg-slate-50/75 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold border border-blue-100">
                            {teacher.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-extrabold text-slate-800 block">{teacher.name}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-700">{teacher.email}</td>
                      <td className="px-6 py-4 font-mono text-slate-500">{teacher.phone}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {teacher.subjects.map(s => (
                            <span key={s} className="bg-slate-50 border border-slate-200 text-slate-600 px-2 py-0.5 rounded-md font-bold text-[9px]">{s}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {teacher.classes.map(c => (
                            <span key={c} className="bg-primary-50 text-primary-700 px-2 py-0.5 rounded-md font-bold text-[9px]">{c}</span>
                          ))}
                        </div>
                      </td>
                      {hasWriteAccess && (
                        <td className="px-6 py-4 text-right">
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => handleOpenEditModal(teacher)}
                              className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-primary-600 cursor-pointer transition-colors"
                              title="Edit teacher"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(teacher)}
                              className="p-2 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-100 rounded-lg text-rose-600 cursor-pointer transition-colors"
                              title="Delete record"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          /* NON-TEACHING STAFF TABLE */
          filteredStaff.length === 0 ? (
            <div className="p-16 text-center text-slate-400 flex flex-col items-center gap-3">
              <Users className="h-10 w-10 text-slate-300" />
              <div>
                <h3 className="font-bold text-slate-700 text-sm">No Support Staff Found</h3>
                <p className="text-xs text-slate-400 mt-1">Try tweaking filters or look for another role</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="px-6 py-4">Staff Member</th>
                    <th className="px-6 py-4">Department Role</th>
                    <th className="px-6 py-4">Email Address</th>
                    <th className="px-6 py-4">Phone No.</th>
                    <th className="px-6 py-4">SaaS Privileges</th>
                    {hasWriteAccess && <th className="px-6 py-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                  {filteredStaff.map((staffMember) => (
                    <tr key={staffMember.id} className="hover:bg-slate-50/75 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center font-bold border border-emerald-100">
                            {staffMember.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-extrabold text-slate-800 block">{staffMember.name}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold px-2.5 py-1 rounded-lg">
                          {staffMember.roleName}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-750">{staffMember.email}</td>
                      <td className="px-6 py-4 font-mono text-slate-500">{staffMember.phone}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {staffMember.permissions.map(p => (
                            <span key={p} className="bg-slate-100 border border-slate-200 text-slate-600 px-2 py-0.5 rounded-md font-bold text-[9px]">{p}</span>
                          ))}
                        </div>
                      </td>
                      {hasWriteAccess && (
                        <td className="px-6 py-4 text-right">
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => handleOpenEditModal(staffMember)}
                              className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-primary-600 cursor-pointer transition-colors"
                              title="Edit staff details"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(staffMember)}
                              className="p-2 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-100 rounded-lg text-rose-600 cursor-pointer transition-colors"
                              title="Remove staff record"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* --- ADD/EDIT DIALOG FORM MODAL --- */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-100 w-full max-w-md rounded-3xl shadow-2xl flex flex-col animate-slide-in">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h3 className="font-extrabold text-slate-800 text-sm md:text-base flex items-center gap-2">
                <PlusCircle className="h-5 w-5 text-primary-500" />
                {editingItem ? 'Edit Profile details' : `Register New ${activeTab === 'teachers' ? 'Faculty Member' : 'Support Staff'}`}
              </h3>
              <button onClick={() => setFormOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold p-1">✕</button>
            </div>
            
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 text-xs font-semibold text-slate-700 overflow-y-auto max-h-[75vh]">
              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Full Name</label>
                <input
                  type="text"
                  required
                  value={activeTab === 'teachers' ? teacherFormData.name : staffFormData.name}
                  onChange={(e) => {
                    if (activeTab === 'teachers') setTeacherFormData({ ...teacherFormData, name: e.target.value });
                    else setStaffFormData({ ...staffFormData, name: e.target.value });
                  }}
                  className="block w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-hidden"
                  placeholder="e.g. Priya Mehta"
                />
              </div>

              {/* Email Address */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Email Address</label>
                <input
                  type="email"
                  required
                  value={activeTab === 'teachers' ? teacherFormData.email : staffFormData.email}
                  onChange={(e) => {
                    if (activeTab === 'teachers') setTeacherFormData({ ...teacherFormData, email: e.target.value });
                    else setStaffFormData({ ...staffFormData, email: e.target.value });
                  }}
                  className="block w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-hidden"
                  placeholder="e.g. name@angels.edu.in"
                />
              </div>

              {/* Phone No */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Phone No (10 Digits)</label>
                <input
                  type="text"
                  required
                  value={activeTab === 'teachers' ? teacherFormData.phone : staffFormData.phone}
                  onChange={(e) => {
                    if (activeTab === 'teachers') setTeacherFormData({ ...teacherFormData, phone: e.target.value });
                    else setStaffFormData({ ...staffFormData, phone: e.target.value });
                  }}
                  className="block w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-hidden"
                  placeholder="e.g. 9876500112"
                />
                {(activeTab === 'teachers' ? formErrors.phone : formErrors.phone) && (
                  <span className="text-[10px] text-red-500 block font-bold">{activeTab === 'teachers' ? formErrors.phone : formErrors.phone}</span>
                )}
              </div>

              {/* Teaching Specific Fields */}
              {activeTab === 'teachers' && (
                <>
                  {/* Subjects */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Subjects Assigned (Comma-separated)</label>
                    <input
                      type="text"
                      required
                      value={teacherFormData.subjects}
                      onChange={(e) => setTeacherFormData({ ...teacherFormData, subjects: e.target.value })}
                      className="block w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-hidden"
                      placeholder="e.g. Mathematics, Science"
                    />
                  </div>

                  {/* Classes */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Classes Assigned (Comma-separated)</label>
                    <input
                      type="text"
                      required
                      value={teacherFormData.classes}
                      onChange={(e) => setTeacherFormData({ ...teacherFormData, classes: e.target.value })}
                      className="block w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-hidden"
                      placeholder="e.g. Class 7-A, Class 6-A"
                    />
                  </div>
                </>
              )}

              {/* Staff Specific Fields */}
              {activeTab === 'staff' && (
                <>
                  {/* Department Role select */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Support Role / Department</label>
                    <select
                      value={staffFormData.roleName}
                      onChange={(e) => setStaffFormData({ ...staffFormData, roleName: e.target.value })}
                      className="block w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 cursor-pointer focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-hidden text-xs"
                    >
                      <option value="Accountant">Accountant (Finance & Receipts)</option>
                      <option value="Librarian">Librarian (Book logs)</option>
                      <option value="Receptionist">Receptionist</option>
                      <option value="Peon">Support Peon</option>
                    </select>
                  </div>

                  {/* Permissions checkboxes */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <label className="text-xs font-bold text-slate-500 uppercase block">SaaS Portal Permissions</label>
                    <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                      <label className="flex items-center gap-2 bg-slate-50 p-2 border border-slate-200 rounded-lg cursor-pointer">
                        <input
                          type="checkbox"
                          checked={staffFormData.permissions.includes('manage_fees')}
                          onChange={() => handlePermissionCheckbox('manage_fees')}
                          className="rounded-sm border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                        />
                        Manage Fees
                      </label>
                      <label className="flex items-center gap-2 bg-slate-50 p-2 border border-slate-200 rounded-lg cursor-pointer">
                        <input
                          type="checkbox"
                          checked={staffFormData.permissions.includes('view_reports')}
                          onChange={() => handlePermissionCheckbox('view_reports')}
                          className="rounded-sm border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                        />
                        View Reports
                      </label>
                      <label className="flex items-center gap-2 bg-slate-50 p-2 border border-slate-200 rounded-lg cursor-pointer">
                        <input
                          type="checkbox"
                          checked={staffFormData.permissions.includes('view_students')}
                          onChange={() => handlePermissionCheckbox('view_students')}
                          className="rounded-sm border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                        />
                        View Students
                      </label>
                      <label className="flex items-center gap-2 bg-slate-50 p-2 border border-slate-200 rounded-lg cursor-pointer">
                        <input
                          type="checkbox"
                          checked={staffFormData.permissions.includes('general_access')}
                          onChange={() => handlePermissionCheckbox('general_access')}
                          className="rounded-sm border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                        />
                        General Access
                      </label>
                    </div>
                  </div>
                </>
              )}

              {/* Form Actions */}
              <div className="flex gap-2 justify-end border-t border-slate-100 pt-4 shrink-0">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
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
                      Registering...
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
    </div>
  );
}
