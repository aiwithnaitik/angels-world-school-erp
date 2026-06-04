import { NextResponse } from 'next/server';
import { DataService } from '@/services/dataService';
import { z } from 'zod';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

const studentCreateSchema = z.object({
  admissionNumber: z.string().optional().or(z.literal('')),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  class: z.string().min(1, 'Class is required'),
  section: z.string().min(1, 'Section is required'),
  parentName: z.string().optional().default(''),
  parentPhone: z.string().optional().default('').refine(val => !val || /^\d+$/.test(val), 'Parent phone must contain only digits'),
  parentEmail: z.string().email('Invalid parent email').optional().or(z.literal('')),
  address: z.string().optional().default(''),
  emergencyContact: z.string().optional().default('').refine(val => !val || /^\d+$/.test(val), 'Emergency contact must contain only digits'),
  profileImage: z.string().optional(),
  dateOfBirth: z.string().optional().or(z.literal('')),
  dateOfAdmission: z.string().optional().or(z.literal('')),
  motherName: z.string().optional().or(z.literal('')),
  dateOfDeactivation: z.string().optional().or(z.literal(''))
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
    const className = searchParams.get('class');
    const search = searchParams.get('search');

    let list: any[] = await DataService.getStudents();

    // Apply filters
    if (className) {
      list = list.filter(s => s.class.toLowerCase() === className.toLowerCase());
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.admissionNumber.toLowerCase().includes(q) ||
        s.parentName.toLowerCase().includes(q)
      );
    }

    return NextResponse.json(list);
  } catch (error) {
    console.error('Students fetch API error:', error);
    return NextResponse.json({ error: 'Failed to fetch students data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // 1. Enforce admin/teacher authority
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    const session = token ? verifyToken(token) : null;
    if (!session || (session.role !== 'ADMIN' && session.role !== 'TEACHER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    
    // Zod Validation
    const validation = studentCreateSchema.safeParse(body);
    if (!validation.success) {
      const issues = validation.error.flatten().fieldErrors;
      return NextResponse.json({ error: 'Validation failed', fields: issues }, { status: 400 });
    }

    const newStudent = await DataService.createStudent(validation.data);

    // Audit logs
    await DataService.createLog(
      'CREATE_STUDENT',
      `Student ${newStudent.name} admitted with ID ${newStudent.admissionNumber} in ${newStudent.class}-${newStudent.section}`,
      session.id
    );

    return NextResponse.json({ success: true, student: newStudent }, { status: 201 });
  } catch (error) {
    console.error('Student create API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    const session = token ? verifyToken(token) : null;
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { ids } = body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    for (const id of ids) {
      await DataService.deleteStudent(id);
    }

    await DataService.createLog(
      'BULK_DELETE_STUDENTS',
      `Successfully removed ${ids.length} students from the system by ${session.name}`,
      session.id
    );

    return NextResponse.json({ success: true, count: ids.length });
  } catch (error) {
    console.error('Bulk delete API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
