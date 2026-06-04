import { NextResponse } from 'next/server';
import { DataService } from '@/services/dataService';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { z } from 'zod';

const staffSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^\d{10}$/, 'Phone must be exactly 10 digits'),
  roleName: z.string().min(2, 'Role name is required'),
  permissions: z.array(z.string()).min(1, 'At least one permission is required')
});

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const list = await DataService.getStaff();
    return NextResponse.json(list);
  } catch (error) {
    console.error('Fetch staff API error:', error);
    return NextResponse.json({ error: 'Failed to retrieve staff list' }, { status: 500 });
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
    const validation = staffSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Validation failed', fields: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const newStaff = await DataService.createStaff(validation.data);

    // Audit logs
    await DataService.createLog(
      'CREATE_STAFF',
      `Registered staff ${newStaff.name} with role ${newStaff.roleName}`,
      session.id
    );

    return NextResponse.json({ success: true, staff: newStaff }, { status: 201 });
  } catch (error) {
    console.error('Create staff API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
