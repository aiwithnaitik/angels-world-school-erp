import { NextResponse } from 'next/server';
import { DataService } from '@/services/dataService';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    // 1. Authorize session
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: 'Unauthorized session' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const academicYear = searchParams.get('academicYear');

    const structures = await DataService.getFeeStructures(academicYear || undefined);
    return NextResponse.json(structures);
  } catch (error) {
    console.error('Fee structures fetch API error:', error);
    return NextResponse.json({ error: 'Failed to fetch fee structures' }, { status: 500 });
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
    const { class: className, studentType, academicYear, totalFees, admissionFee, components } = body;

    if (!className || !studentType || !academicYear || totalFees === undefined || !Array.isArray(components)) {
      return NextResponse.json({ error: 'Invalid fee package payload' }, { status: 400 });
    }

    const structure = await DataService.upsertFeeStructure({
      class: className,
      studentType,
      academicYear,
      totalFees,
      admissionFee: admissionFee || 0,
      components
    });

    await DataService.createLog(
      'UPSERT_FEE_STRUCTURE',
      `Upserted fee package structure for ${className} (${studentType}) for year ${academicYear} with total fee ${totalFees} by ${session.name}`,
      session.id
    );

    return NextResponse.json({ success: true, structure });
  } catch (error) {
    console.error('Fee structure POST API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
