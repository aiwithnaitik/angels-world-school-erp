import { NextResponse } from 'next/server';
import { DataService } from '@/services/dataService';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { z } from 'zod';

const teacherUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().regex(/^\d{10}$/).optional(),
  subjects: z.array(z.string()).optional(),
  classes: z.array(z.string()).optional()
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, props: RouteParams) {
  try {
    const { id } = await props.params;

    // 1. Enforce Admin only
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    const session = token ? verifyToken(token) : null;
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validation = teacherUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Validation failed', fields: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const updated = await DataService.updateTeacher(id, validation.data);
    if (!updated) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    // Audit logs
    await DataService.createLog('UPDATE_TEACHER', `Updated details for teacher ${updated.name}`, session.id);

    return NextResponse.json({ success: true, teacher: updated });
  } catch (error) {
    console.error('Update teacher error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, props: RouteParams) {
  try {
    const { id } = await props.params;

    // 1. Enforce Admin only
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    const session = token ? verifyToken(token) : null;
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const list = await DataService.getTeachers();
    const teacher = list.find(t => t.id === id);
    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    await DataService.deleteTeacher(id);

    // Audit logs
    await DataService.createLog('DELETE_TEACHER', `Removed teacher ${teacher.name} from records`, session.id);

    return NextResponse.json({ success: true, message: 'Teacher deleted successfully' });
  } catch (error) {
    console.error('Delete teacher error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 550 });
  }
}
