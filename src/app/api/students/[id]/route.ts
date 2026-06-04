import { NextResponse } from 'next/server';
import { DataService } from '@/services/dataService';
import { z } from 'zod';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

const studentUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  class: z.string().min(1).optional(),
  section: z.string().min(1).optional(),
  parentName: z.string().optional().or(z.literal('')),
  parentPhone: z.string().optional().or(z.literal('')).refine(val => !val || /^\d+$/.test(val), 'Parent phone must contain only digits'),
  parentEmail: z.string().email().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  emergencyContact: z.string().optional().or(z.literal('')).refine(val => !val || /^\d+$/.test(val), 'Emergency contact must contain only digits'),
  profileImage: z.string().optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'GRADUATED']).optional(),
  dateOfBirth: z.string().optional().or(z.literal('')),
  dateOfAdmission: z.string().optional().or(z.literal('')),
  motherName: z.string().optional().or(z.literal('')),
  dateOfDeactivation: z.string().optional().or(z.literal(''))
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, props: RouteParams) {
  try {
    const { id } = await props.params;

    // 1. Authorize session
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const student = await DataService.getStudentById(id);
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    return NextResponse.json(student);
  } catch (error) {
    console.error('Fetch student profile API error:', error);
    return NextResponse.json({ error: 'Failed to retrieve student profile' }, { status: 500 });
  }
}

export async function PUT(request: Request, props: RouteParams) {
  try {
    const { id } = await props.params;

    // 1. Authorize session (Admin/Teacher only)
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    const session = token ? verifyToken(token) : null;
    if (!session || (session.role !== 'ADMIN' && session.role !== 'TEACHER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const student = await DataService.getStudentById(id);
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const body = await request.json();
    const validation = studentUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Validation failed', fields: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const updated = await DataService.updateStudent(id, validation.data);

    // Audit log
    await DataService.createLog(
      'UPDATE_STUDENT',
      `Student ${student.name} profile updated by ${session.name}`,
      session.id
    );

    return NextResponse.json({ success: true, student: updated });
  } catch (error) {
    console.error('Update student profile error:', error);
    return NextResponse.json({ error: 'Failed to update student profile' }, { status: 500 });
  }
}

export async function DELETE(request: Request, props: RouteParams) {
  try {
    const { id } = await props.params;

    // 1. Authorize session (Admin only)
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    const session = token ? verifyToken(token) : null;
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const student = await DataService.getStudentById(id);
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    await DataService.deleteStudent(id);

    // Audit log
    await DataService.createLog(
      'DELETE_STUDENT',
      `Student ${student.name} (${student.admissionNumber}) permanently removed from system`,
      session.id
    );

    return NextResponse.json({ success: true, message: 'Student removed successfully' });
  } catch (error) {
    console.error('Delete student API error:', error);
    return NextResponse.json({ error: 'Failed to delete student' }, { status: 500 });
  }
}
