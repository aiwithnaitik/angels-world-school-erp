import { NextResponse } from 'next/server';
import { DataService } from '@/services/dataService';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { z } from 'zod';

const feeUpdateSchema = z.object({
  amount: z.number().positive('Fee amount must be greater than zero'),
  paidAmount: z.number().nonnegative('Paid amount cannot be negative'),
  paymentMethod: z.string().nullable().optional(),
  remarks: z.string().nullable().optional(),
  componentName: z.string().nullable().optional()
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // 1. Authorize session (Admin/Accountant only)
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    const session = token ? verifyToken(token) : null;
    if (!session || (session.role !== 'ADMIN' && session.role !== 'ACCOUNTANT')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validation = feeUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', fields: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const updated = await DataService.updateFeeRecord(id, validation.data);
    if (!updated) {
      return NextResponse.json({ error: 'Fee record not found or update failed' }, { status: 404 });
    }

    // Dynamic fetch student details for logging
    const students = await DataService.getStudents();
    const student = students.find(s => s.id === updated.studentId);

    // Audit log
    await DataService.createLog(
      'UPDATE_FEE_RECORD',
      `Updated fee record ID ${id} for student ${student?.name || 'Unknown'}. New amount: ${updated.amount}, paid: ${updated.paidAmount}`,
      session.id
    );

    return NextResponse.json({ success: true, fee: updated });
  } catch (error) {
    console.error('Fee PUT API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // 1. Authorize session (Admin only)
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    const session = token ? verifyToken(token) : null;
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const list = await DataService.getFees();
    const record = list.find((f: any) => f.id === id);
    if (!record) {
      return NextResponse.json({ error: 'Fee record not found' }, { status: 404 });
    }

    await DataService.deleteFeeRecord(id);

    // Audit log
    await DataService.createLog(
      'DELETE_FEE_RECORD',
      `Deleted fee record ID ${id} of amount ${record.amount} for student ${record.student?.name || 'Unknown'}`,
      session.id
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Fee DELETE API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
