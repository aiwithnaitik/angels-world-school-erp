import { NextResponse } from 'next/server';
import { DataService } from '@/services/dataService';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { z } from 'zod';

const settingUpdateSchema = z.object({
  key: z.string().min(1, 'Setting key is required'),
  value: z.string().min(1, 'Setting value is required')
});

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dict = await DataService.getSettings();
    return NextResponse.json(dict);
  } catch (error) {
    console.error('Fetch settings error:', error);
    return NextResponse.json({ error: 'Failed to retrieve settings' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // 1. Enforce Admin authority
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    const session = token ? verifyToken(token) : null;
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validation = settingUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Validation failed', fields: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { key, value } = validation.data;
    await DataService.updateSetting(key, value);

    // Audit logs
    await DataService.createLog('UPDATE_SETTING', `Modified system setting: "${key}" updated to "${value}"`, session.id);

    return NextResponse.json({ success: true, key, value });
  } catch (error) {
    console.error('Save setting API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 550 });
  }
}
