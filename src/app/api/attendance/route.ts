import { NextResponse } from 'next/server';
import { DataService } from '@/services/dataService';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { AttendanceStatus } from '@prisma/client';

const attendanceMarkSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in format YYYY-MM-DD'),
  class: z.string().min(1, 'Class is required'),
  section: z.string().min(1, 'Section is required'),
  records: z.array(z.object({
    studentId: z.string().min(1),
    status: z.enum(['PRESENT', 'ABSENT', 'LATE'])
  })).min(1, 'At least one student record is required')
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
    const date = searchParams.get('date');
    const className = searchParams.get('class');
    const section = searchParams.get('section');

    if (!date || !className || !section) {
      return NextResponse.json({ error: 'Date, class, and section are required parameters' }, { status: 400 });
    }

    // Fetch existing attendance logs
    const existing = await DataService.getAttendance(date);
    const filteredExisting = existing.filter(a =>
      a.class.toLowerCase() === className.toLowerCase() &&
      a.section.toLowerCase() === section.toLowerCase()
    );

    // Fetch active students in class and section
    const students = await DataService.getStudents();
    const filteredStudents = students.filter(s =>
      s.class.toLowerCase() === className.toLowerCase() &&
      s.section.toLowerCase() === section.toLowerCase() &&
      s.status === 'ACTIVE'
    );

    // Merge existing attendance logs or compile fresh template
    const logs = filteredStudents.map(student => {
      const match = filteredExisting.find(a => a.studentId === student.id);
      return {
        studentId: student.id,
        studentName: student.name,
        admissionNumber: student.admissionNumber,
        status: match ? match.status : 'PRESENT', // Default is PRESENT on fresh sheet
        marked: !!match
      };
    });

    return NextResponse.json({
      date,
      class: className,
      section,
      records: logs
    });
  } catch (error) {
    console.error('Attendance fetch error:', error);
    return NextResponse.json({ error: 'Failed to retrieve attendance log sheets' }, { status: 500 });
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
    const validation = attendanceMarkSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Validation failed', fields: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { date, class: className, section, records } = validation.data;

    // Map into Prisma records
    const attendanceRecords = records.map(r => ({
      studentId: r.studentId,
      status: r.status as AttendanceStatus,
      class: className,
      section,
      date,
      markedBy: session.name
    }));

    await DataService.markAttendance(attendanceRecords);

    // Audit logs
    await DataService.createLog(
      'MARK_ATTENDANCE',
      `Attendance marked for ${className}-${section} on date ${date} by ${session.name}. Records: ${records.length}`,
      session.id
    );

    return NextResponse.json({ success: true, message: 'Attendance registered successfully' });
  } catch (error) {
    console.error('Attendance save API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
