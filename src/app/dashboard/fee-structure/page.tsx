'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { DollarSign, Loader2, AlertCircle, TrendingUp } from 'lucide-react';

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

export default function FeeStructurePage() {
  const { user } = useAuth();
  const [structures, setStructures] = useState<FeeStructure[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState('2026-27');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const loadFeeStructures = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/fee-structures?academicYear=${selectedYear}`);
      if (res.ok) {
        const data = await res.json();
        setStructures(data);
      } else {
        showToast('Failed to load fee structures', 'error');
      }
    } catch (error) {
      console.error('Error loading fee structures:', error);
      showToast('Connection error', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeeStructures();
  }, [selectedYear]);

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Group structures by student type
  const newStudents = structures.filter(s => s.studentType === 'NEW').sort((a, b) => {
    const order = ['P.NUR', 'NUR/KG', '1ST/2ND/3RD', '4TH/5TH', '6TH/7TH', '8TH', '9TH'];
    return order.indexOf(a.class) - order.indexOf(b.class);
  });
  
  const oldStudents = structures.filter(s => s.studentType === 'OLD').sort((a, b) => {
    const order = ['NUR/KG', '1ST/2ND/3RD', '4TH/5TH', '6TH/7TH', '8TH', '9TH', '10TH'];
    return order.indexOf(a.class) - order.indexOf(b.class);
  });

  const FeeStructureTable = ({ title, data }: { title: string; data: FeeStructure[] }) => (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <TrendingUp className="w-6 h-6 text-blue-600" />
        {title}
      </h2>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-blue-100 border-b-2 border-blue-300">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-800">Class</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-800">Total Annual Fees</th>
              {title.includes('NEW') && <th className="px-4 py-3 text-center font-semibold text-gray-800">Admission Fee</th>}
              <th className="px-4 py-3 text-center font-semibold text-gray-800">April</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-800">August</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-800">December</th>
            </tr>
          </thead>
          <tbody>
            {data.map((structure) => {
              const aprilComponent = structure.components.find(c => c.name === 'APRIL');
              const augustComponent = structure.components.find(c => c.name === 'AUGUST');
              const decemberComponent = structure.components.find(c => c.name === 'DECEMBER');

              return (
                <tr key={structure.id} className="border-b hover:bg-blue-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-800">{structure.class}</td>
                  <td className="px-4 py-3 text-center font-semibold text-green-700">
                    ₹{structure.totalFees.toLocaleString('en-IN')}
                  </td>
                  {title.includes('NEW') && (
                    <td className="px-4 py-3 text-center text-orange-600 font-medium">
                      ₹{structure.admissionFee.toLocaleString('en-IN')}
                    </td>
                  )}
                  <td className="px-4 py-3 text-center text-blue-600 font-medium">
                    ₹{aprilComponent?.amount.toLocaleString('en-IN') || '0'}
                  </td>
                  <td className="px-4 py-3 text-center text-blue-600 font-medium">
                    ₹{augustComponent?.amount.toLocaleString('en-IN') || '0'}
                  </td>
                  <td className="px-4 py-3 text-center text-blue-600 font-medium">
                    ₹{decemberComponent?.amount.toLocaleString('en-IN') || '0'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (!user || user.role === 'TEACHER') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-gray-600">You don't have permission to view this page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg text-white mb-4 ${
          toast.type === 'success' ? 'bg-green-600' :
          toast.type === 'error' ? 'bg-red-600' : 'bg-blue-600'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 flex items-center gap-3">
          <DollarSign className="w-8 h-8 text-blue-600" />
          Fee Structure - {selectedYear}
        </h1>
        <p className="text-gray-600 mt-2">Annual Fees Package (April 2026 to March 2027)</p>
      </div>

      {/* Year Selection */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setSelectedYear('2026-27')}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            selectedYear === '2026-27'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-blue-600 border-2 border-blue-600 hover:bg-blue-50'
          }`}
        >
          2026-27
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        </div>
      ) : (
        <>
          {newStudents.length > 0 && <FeeStructureTable title="NEW STUDENTS ADMISSIONS 2026-27" data={newStudents} />}
          {oldStudents.length > 0 && <FeeStructureTable title="OLD STUDENTS ADMISSIONS 2026-27" data={oldStudents} />}

          {structures.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No fee structures found for this year</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
