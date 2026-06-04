import { NextResponse } from 'next/server';
import { DataService } from '@/services/dataService';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { z } from 'zod';

const teacherSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^\d{10}$/, 'Phone must be exactly 10 digits'),
  subjects: z.array(z.string()).min(1, 'At least one subject is required'),
  classes: z.array(z.string()).min(1, 'At least one class assignment is required')
});

export async function GET() {
  try {
    // 1. Authorize session
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const list = await DataService.getTeachers();
    return NextResponse.json(list);
  } catch (error) {
    console.error('Fetch teachers API error:', error);
    return NextResponse.json({ error: 'Failed to retrieve teachers' }, { status: 550 });
  }
}

export async function POST(request: Request) {
  try {
    // 1. Enforce Admin only
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    const session = token ? verifyToken(token) : null;
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validation = teacherSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Validation failed', fields: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const newTeacher = await DataService.createTeacher(validation.data);

    // Audit logs
    await DataService.createLog(
      'CREATE_TEACHER',
      `Registered teacher ${newTeacher.name} with subjects ${newTeacher.subjects.join(', ')}`,
      session.id
    );

    return NextResponse.json({ success: true, teacher: newTeacher }, { status: 201 });
  } catch (error) {
    console.error('Create teacher API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
