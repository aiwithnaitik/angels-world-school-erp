import { NextResponse } from 'next/server';
import { DataService } from '@/services/dataService';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { z } from 'zod';

const paymentSchema = z.object({
  feeId: z.string().min(1, 'Fee ID is required'),
  amount: z.number().positive('Payment amount must be greater than zero'),
  paymentMethod: z.string().min(1, 'Payment method is required'),
  remarks: z.string().optional()
});

const feeCreateSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  amount: z.number().positive('Fee amount must be greater than zero'),
  dueDate: z.string().min(1, 'Due date is required'),
  remarks: z.string().optional(),
  componentName: z.string().optional(),
  academicYear: z.string().optional()
});

export async function GET(request: Request) {
  try {
    // 1. Authorize session
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: 'Unauthorized session' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');

    let list: any[] = await DataService.getFees();

    // Apply filters
    if (status) {
      list = list.filter(f => f.status.toUpperCase() === status.toUpperCase());
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(f =>
        f.student?.name.toLowerCase().includes(q) ||
        f.student?.admissionNumber.toLowerCase().includes(q) ||
        (f.receiptNumber && f.receiptNumber.toLowerCase().includes(q))
      );
    }

    return NextResponse.json(list);
  } catch (error) {
    console.error('Fees fetch API error:', error);
    return NextResponse.json({ error: 'Failed to fetch fee log records' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // 1. Authorize session (Admin/Accountant only)
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    const session = token ? verifyToken(token) : null;
    if (!session || (session.role !== 'ADMIN' && session.role !== 'ACCOUNTANT')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    // Differentiate: Add New Fee Record vs Collect Fee Payment
    if (body.studentId) {
      const validation = feeCreateSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json({ error: 'Validation failed', fields: validation.error.flatten().fieldErrors }, { status: 400 });
      }

      const { studentId, amount, dueDate, remarks, componentName, academicYear } = validation.data;
      const newRecord = await DataService.createFeeRecord(studentId, amount, new Date(dueDate), remarks, componentName, academicYear);
      
      const students = await DataService.getStudents();
      const student = students.find(s => s.id === studentId);

      // Audit log
      await DataService.createLog(
        'CREATE_FEE_RECORD',
        `Created fee record of ${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)} for student ${student?.name || 'Unknown'} (${student?.admissionNumber || 'N/A'}) with due date ${dueDate}`,
        session.id
      );

      return NextResponse.json({ success: true, fee: newRecord }, { status: 201 });
    } else {
      const validation = paymentSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json({ error: 'Validation failed', fields: validation.error.flatten().fieldErrors }, { status: 400 });
      }

      const { feeId, amount, paymentMethod, remarks } = validation.data;

      // Execute payment and write calculations
      const updatedRecord = await DataService.createFeePayment(feeId, amount, paymentMethod, remarks);
      if (!updatedRecord) {
        return NextResponse.json({ error: 'Fee record not found or update failed' }, { status: 404 });
      }

      // Dynamic fetch student details for logging
      const students = await DataService.getStudents();
      const student = students.find(s => s.id === updatedRecord.studentId);

      // Audit log
      await DataService.createLog(
        'COLLECT_FEE',
        `Collected ${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)} via ${paymentMethod} for student ${student?.name || 'Unknown'} (${student?.admissionNumber || 'N/A'}). Status: ${updatedRecord.status}. Balance: ${updatedRecord.balance}`,
        session.id
      );

      return NextResponse.json({ success: true, fee: updatedRecord });
    }
  } catch (error) {
    console.error('Fee POST API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
