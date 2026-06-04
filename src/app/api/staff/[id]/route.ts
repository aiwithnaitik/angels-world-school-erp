import { NextResponse } from 'next/server';
import { DataService } from '@/services/dataService';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { z } from 'zod';

const staffUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().regex(/^\d{10}$/).optional(),
  roleName: z.string().min(2).optional(),
  permissions: z.array(z.string()).optional()
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
    const validation = staffUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Validation failed', fields: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const updated = await DataService.updateStaff(id, validation.data);
    if (!updated) {
      return NextResponse.json({ error: 'Staff record not found' }, { status: 404 });
    }

    // Audit logs
    await DataService.createLog('UPDATE_STAFF', `Updated details for staff ${updated.name}`, session.id);

    return NextResponse.json({ success: true, staff: updated });
  } catch (error) {
    console.error('Update staff error:', error);
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

    const list = await DataService.getStaff();
    const record = list.find(s => s.id === id);
    if (!record) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 });
    }

    await DataService.deleteStaff(id);

    // Audit logs
    await DataService.createLog('DELETE_STAFF', `Removed staff member ${record.name} from logs`, session.id);

    return NextResponse.json({ success: true, message: 'Staff deleted successfully' });
  } catch (error) {
    console.error('Delete staff error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
