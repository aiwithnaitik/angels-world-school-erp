import { NextResponse } from 'next/server';
import { DataService } from '@/services/dataService';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { z } from 'zod';

const noticeSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  content: z.string().min(5, 'Content must be at least 5 characters'),
  category: z.enum(['General', 'Event', 'Holiday', 'Examination']),
  author: z.string().min(2, 'Author is required')
});

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const list = await DataService.getNotices();
    return NextResponse.json(list);
  } catch (error) {
    console.error('Fetch notices error:', error);
    return NextResponse.json({ error: 'Failed to retrieve notices' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // 1. Authorize session (Admin/Teacher only)
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    const session = token ? verifyToken(token) : null;
    if (!session || (session.role !== 'ADMIN' && session.role !== 'TEACHER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validation = noticeSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Validation failed', fields: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const newNotice = await DataService.createNotice(validation.data);

    // Audit logs
    await DataService.createLog(
      'CREATE_NOTICE',
      `New notice published: "${newNotice.title}" under category "${newNotice.category}" by ${session.name}`,
      session.id
    );

    return NextResponse.json({ success: true, notice: newNotice }, { status: 201 });
  } catch (error) {
    console.error('Create notice API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
