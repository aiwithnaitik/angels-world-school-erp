import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { isMockDataAllowed } from './security';

// Types representing the database records matching Prisma schema
export interface UserMock {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: 'ADMIN' | 'TEACHER' | 'ACCOUNTANT' | 'STAFF';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StudentMock {
  id: string;
  admissionNumber: string;
  name: string;
  class: string;
  section: string;
  parentName: string;
  parentPhone: string;
  parentEmail?: string;
  address: string;
  emergencyContact: string;
  profileImage?: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'GRADUATED';
  createdAt: string;
  updatedAt: string;
}

export interface TeacherMock {
  id: string;
  name: string;
  email: string;
  phone: string;
  subjects: string[];
  classes: string[];
  profileImage?: string;
  userId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StaffMock {
  id: string;
  name: string;
  email: string;
  phone: string;
  roleName: string;
  permissions: string[];
  userId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FeeRecordMock {
  id: string;
  studentId: string;
  amount: number;
  dueDate: string;
  paidAmount: number;
  balance: number;
  status: 'PAID' | 'UNPAID' | 'PARTIAL';
  paymentDate?: string;
  paymentMethod?: string;
  receiptNumber?: string;
  remarks?: string;
  componentName?: string;
  academicYear?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FeeComponentMock {
  id: string;
  feeStructureId: string;
  name: string;
  amount: number;
  dueMonth: string;
  sequence: number;
  createdAt: string;
  updatedAt: string;
}

export interface FeeStructureMock {
  id: string;
  class: string;
  studentType: string;
  academicYear: string;
  totalFees: number;
  admissionFee: number;
  components: FeeComponentMock[];
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceMock {
  id: string;
  date: string; // ISO date string (YYYY-MM-DD)
  status: 'PRESENT' | 'ABSENT' | 'LATE';
  studentId: string;
  class: string;
  section: string;
  markedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface NoticeMock {
  id: string;
  title: string;
  content: string;
  category: string;
  author: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SettingMock {
  id: string;
  key: string;
  value: string;
  createdAt: string;
  updatedAt: string;
}

export interface SystemLogMock {
  id: string;
  action: string;
  details: string;
  userId?: string;
  createdAt: string;
}

export interface MockSchema {
  users: UserMock[];
  students: StudentMock[];
  teachers: TeacherMock[];
  staff: StaffMock[];
  fees: FeeRecordMock[];
  feeStructures: FeeStructureMock[];
  attendance: AttendanceMock[];
  notices: NoticeMock[];
  settings: SettingMock[];
  logs: SystemLogMock[];
}

const DB_FILE_PATH = path.join(process.cwd(), 'db.json');

// Initialize initial seed data
const getInitialData = (): MockSchema => {
  const timestamp = new Date().toISOString();

  // Generate password hashes using bcrypt
  const salt = bcrypt.genSaltSync(10);
  const principalHash = bcrypt.hashSync('Principal@admin7654', salt);
  const staff1Hash = bcrypt.hashSync('Staff1@5556', salt);
  const staff2Hash = bcrypt.hashSync('Staff2@5556', salt);

  // New user accounts
  const users: UserMock[] = [
    {
      id: 'u-principal-1',
      email: 'Principal@angelsworldschool',
      passwordHash: principalHash,
      name: 'Principal',
      role: 'ADMIN',
      isActive: true,
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: 'u-staff-1',
      email: 'Staff1@angelsworldschool',
      passwordHash: staff1Hash,
      name: 'Staff Member 1',
      role: 'STAFF',
      isActive: true,
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: 'u-staff-2',
      email: 'Staff2@angelsworldschool',
      passwordHash: staff2Hash,
      name: 'Staff Member 2',
      role: 'STAFF',
      isActive: true,
      createdAt: timestamp,
      updatedAt: timestamp
    }
  ];

  // FRESH ERP DEPLOYMENT - EMPTY COLLECTIONS
  // All data will be added through the application
  
  const students: StudentMock[] = [];
  const teachers: TeacherMock[] = [];
  const staff: StaffMock[] = [];
  const fees: FeeRecordMock[] = [];
  const attendance: AttendanceMock[] = [];
  
  // FEE STRUCTURES FOR 2026-27
  // Annual Fees Package: April 2026 to March 2027
  const feeStructures: FeeStructureMock[] = [
    // NEW STUDENTS ADMISSIONS 2026-27
    {
      id: 'fs-1',
      class: 'P.NUR',
      studentType: 'NEW',
      academicYear: '2026-27',
      totalFees: 15000,
      admissionFee: 0,
      components: [
        { id: 'fc-1', feeStructureId: 'fs-1', name: 'APRIL', amount: 15000, dueMonth: 'April', sequence: 1, createdAt: timestamp, updatedAt: timestamp }
      ],
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: 'fs-2',
      class: 'NUR/KG',
      studentType: 'NEW',
      academicYear: '2026-27',
      totalFees: 35000,
      admissionFee: 4500,
      components: [
        { id: 'fc-2', feeStructureId: 'fs-2', name: 'ADMISSION', amount: 4500, dueMonth: 'Admission', sequence: 0, createdAt: timestamp, updatedAt: timestamp },
        { id: 'fc-3', feeStructureId: 'fs-2', name: 'APRIL', amount: 12000, dueMonth: 'April', sequence: 1, createdAt: timestamp, updatedAt: timestamp },
        { id: 'fc-4', feeStructureId: 'fs-2', name: 'AUGUST', amount: 10000, dueMonth: 'August', sequence: 2, createdAt: timestamp, updatedAt: timestamp },
        { id: 'fc-5', feeStructureId: 'fs-2', name: 'DECEMBER', amount: 8500, dueMonth: 'December', sequence: 3, createdAt: timestamp, updatedAt: timestamp }
      ],
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: 'fs-3',
      class: '1ST/2ND/3RD',
      studentType: 'NEW',
      academicYear: '2026-27',
      totalFees: 37000,
      admissionFee: 4500,
      components: [
        { id: 'fc-6', feeStructureId: 'fs-3', name: 'ADMISSION', amount: 4500, dueMonth: 'Admission', sequence: 0, createdAt: timestamp, updatedAt: timestamp },
        { id: 'fc-7', feeStructureId: 'fs-3', name: 'APRIL', amount: 12000, dueMonth: 'April', sequence: 1, createdAt: timestamp, updatedAt: timestamp },
        { id: 'fc-8', feeStructureId: 'fs-3', name: 'AUGUST', amount: 11000, dueMonth: 'August', sequence: 2, createdAt: timestamp, updatedAt: timestamp },
        { id: 'fc-9', feeStructureId: 'fs-3', name: 'DECEMBER', amount: 9500, dueMonth: 'December', sequence: 3, createdAt: timestamp, updatedAt: timestamp }
      ],
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: 'fs-4',
      class: '4TH/5TH',
      studentType: 'NEW',
      academicYear: '2026-27',
      totalFees: 39000,
      admissionFee: 4500,
      components: [
        { id: 'fc-10', feeStructureId: 'fs-4', name: 'ADMISSION', amount: 4500, dueMonth: 'Admission', sequence: 0, createdAt: timestamp, updatedAt: timestamp },
        { id: 'fc-11', feeStructureId: 'fs-4', name: 'APRIL', amount: 13000, dueMonth: 'April', sequence: 1, createdAt: timestamp, updatedAt: timestamp },
        { id: 'fc-12', feeStructureId: 'fs-4', name: 'AUGUST', amount: 11000, dueMonth: 'August', sequence: 2, createdAt: timestamp, updatedAt: timestamp },
        { id: 'fc-13', feeStructureId: 'fs-4', name: 'DECEMBER', amount: 10500, dueMonth: 'December', sequence: 3, createdAt: timestamp, updatedAt: timestamp }
      ],
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: 'fs-5',
      class: '6TH/7TH',
      studentType: 'NEW',
      academicYear: '2026-27',
      totalFees: 41000,
      admissionFee: 4500,
      components: [
        { id: 'fc-14', feeStructureId: 'fs-5', name: 'ADMISSION', amount: 4500, dueMonth: 'Admission', sequence: 0, createdAt: timestamp, updatedAt: timestamp },
        { id: 'fc-15', feeStructureId: 'fs-5', name: 'APRIL', amount: 13000, dueMonth: 'April', sequence: 1, createdAt: timestamp, updatedAt: timestamp },
        { id: 'fc-16', feeStructureId: 'fs-5', name: 'AUGUST', amount: 12000, dueMonth: 'August', sequence: 2, createdAt: timestamp, updatedAt: timestamp },
        { id: 'fc-17', feeStructureId: 'fs-5', name: 'DECEMBER', amount: 11500, dueMonth: 'December', sequence: 3, createdAt: timestamp, updatedAt: timestamp }
      ],
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: 'fs-6',
      class: '8TH',
      studentType: 'NEW',
      academicYear: '2026-27',
      totalFees: 42000,
      admissionFee: 4000,
      components: [
        { id: 'fc-18', feeStructureId: 'fs-6', name: 'ADMISSION', amount: 4000, dueMonth: 'Admission', sequence: 0, createdAt: timestamp, updatedAt: timestamp },
        { id: 'fc-19', feeStructureId: 'fs-6', name: 'APRIL', amount: 14000, dueMonth: 'April', sequence: 1, createdAt: timestamp, updatedAt: timestamp },
        { id: 'fc-20', feeStructureId: 'fs-6', name: 'AUGUST', amount: 12000, dueMonth: 'August', sequence: 2, createdAt: timestamp, updatedAt: timestamp },
        { id: 'fc-21', feeStructureId: 'fs-6', name: 'DECEMBER', amount: 12000, dueMonth: 'December', sequence: 3, createdAt: timestamp, updatedAt: timestamp }
      ],
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: 'fs-7',
      class: '9TH',
      studentType: 'NEW',
      academicYear: '2026-27',
      totalFees: 42000,
      admissionFee: 4000,
      components: [
        { id: 'fc-22', feeStructureId: 'fs-7', name: 'ADMISSION', amount: 4000, dueMonth: 'Admission', sequence: 0, createdAt: timestamp, updatedAt: timestamp },
        { id: 'fc-23', feeStructureId: 'fs-7', name: 'APRIL', amount: 14000, dueMonth: 'April', sequence: 1, createdAt: timestamp, updatedAt: timestamp },
        { id: 'fc-24', feeStructureId: 'fs-7', name: 'AUGUST', amount: 12000, dueMonth: 'August', sequence: 2, createdAt: timestamp, updatedAt: timestamp },
        { id: 'fc-25', feeStructureId: 'fs-7', name: 'DECEMBER', amount: 12000, dueMonth: 'December', sequence: 3, createdAt: timestamp, updatedAt: timestamp }
      ],
      createdAt: timestamp,
      updatedAt: timestamp
    },
    // OLD STUDENTS ADMISSIONS 2026-27
    {
      id: 'fs-8',
      class: 'NUR/KG',
      studentType: 'OLD',
      academicYear: '2026-27',
      totalFees: 30500,
      admissionFee: 0,
      components: [
        { id: 'fc-26', feeStructureId: 'fs-8', name: 'APRIL', amount: 12000, dueMonth: 'April', sequence: 1, createdAt: timestamp, updatedAt: timestamp },
        { id: 'fc-27', feeStructureId: 'fs-8', name: 'AUGUST', amount: 10000, dueMonth: 'August', sequence: 2, createdAt: timestamp, updatedAt: timestamp },
        { id: 'fc-28', feeStructureId: 'fs-8', name: 'DECEMBER', amount: 8500, dueMonth: 'December', sequence: 3, createdAt: timestamp, updatedAt: timestamp }
      ],
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: 'fs-9',
      class: '1ST/2ND/3RD',
      studentType: 'OLD',
      academicYear: '2026-27',
      totalFees: 32500,
      admissionFee: 0,
      components: [
        { id: 'fc-29', feeStructureId: 'fs-9', name: 'APRIL', amount: 12000, dueMonth: 'April', sequence: 1, createdAt: timestamp, updatedAt: timestamp },
        { id: 'fc-30', feeStructureId: 'fs-9', name: 'AUGUST', amount: 11000, dueMonth: 'August', sequence: 2, createdAt: timestamp, updatedAt: timestamp },
        { id: 'fc-31', feeStructureId: 'fs-9', name: 'DECEMBER', amount: 9500, dueMonth: 'December', sequence: 3, createdAt: timestamp, updatedAt: timestamp }
      ],
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: 'fs-10',
      class: '4TH/5TH',
      studentType: 'OLD',
      academicYear: '2026-27',
      totalFees: 34500,
      admissionFee: 0,
      components: [
        { id: 'fc-32', feeStructureId: 'fs-10', name: 'APRIL', amount: 13000, dueMonth: 'April', sequence: 1, createdAt: timestamp, updatedAt: timestamp },
        { id: 'fc-33', feeStructureId: 'fs-10', name: 'AUGUST', amount: 11000, dueMonth: 'August', sequence: 2, createdAt: timestamp, updatedAt: timestamp },
        { id: 'fc-34', feeStructureId: 'fs-10', name: 'DECEMBER', amount: 10500, dueMonth: 'December', sequence: 3, createdAt: timestamp, updatedAt: timestamp }
      ],
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: 'fs-11',
      class: '6TH/7TH',
      studentType: 'OLD',
      academicYear: '2026-27',
      totalFees: 36500,
      admissionFee: 0,
      components: [
        { id: 'fc-35', feeStructureId: 'fs-11', name: 'APRIL', amount: 13000, dueMonth: 'April', sequence: 1, createdAt: timestamp, updatedAt: timestamp },
        { id: 'fc-36', feeStructureId: 'fs-11', name: 'AUGUST', amount: 12000, dueMonth: 'August', sequence: 2, createdAt: timestamp, updatedAt: timestamp },
        { id: 'fc-37', feeStructureId: 'fs-11', name: 'DECEMBER', amount: 11500, dueMonth: 'December', sequence: 3, createdAt: timestamp, updatedAt: timestamp }
      ],
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: 'fs-12',
      class: '8TH',
      studentType: 'OLD',
      academicYear: '2026-27',
      totalFees: 38000,
      admissionFee: 0,
      components: [
        { id: 'fc-38', feeStructureId: 'fs-12', name: 'APRIL', amount: 14000, dueMonth: 'April', sequence: 1, createdAt: timestamp, updatedAt: timestamp },
        { id: 'fc-39', feeStructureId: 'fs-12', name: 'AUGUST', amount: 12000, dueMonth: 'August', sequence: 2, createdAt: timestamp, updatedAt: timestamp },
        { id: 'fc-40', feeStructureId: 'fs-12', name: 'DECEMBER', amount: 12000, dueMonth: 'December', sequence: 3, createdAt: timestamp, updatedAt: timestamp }
      ],
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: 'fs-13',
      class: '9TH',
      studentType: 'OLD',
      academicYear: '2026-27',
      totalFees: 38000,
      admissionFee: 0,
      components: [
        { id: 'fc-41', feeStructureId: 'fs-13', name: 'APRIL', amount: 14000, dueMonth: 'April', sequence: 1, createdAt: timestamp, updatedAt: timestamp },
        { id: 'fc-42', feeStructureId: 'fs-13', name: 'AUGUST', amount: 12000, dueMonth: 'August', sequence: 2, createdAt: timestamp, updatedAt: timestamp },
        { id: 'fc-43', feeStructureId: 'fs-13', name: 'DECEMBER', amount: 12000, dueMonth: 'December', sequence: 3, createdAt: timestamp, updatedAt: timestamp }
      ],
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: 'fs-14',
      class: '10TH',
      studentType: 'OLD',
      academicYear: '2026-27',
      totalFees: 39000,
      admissionFee: 0,
      components: [
        { id: 'fc-44', feeStructureId: 'fs-14', name: 'APRIL', amount: 15000, dueMonth: 'April', sequence: 1, createdAt: timestamp, updatedAt: timestamp },
        { id: 'fc-45', feeStructureId: 'fs-14', name: 'AUGUST', amount: 12000, dueMonth: 'August', sequence: 2, createdAt: timestamp, updatedAt: timestamp },
        { id: 'fc-46', feeStructureId: 'fs-14', name: 'DECEMBER', amount: 12000, dueMonth: 'December', sequence: 3, createdAt: timestamp, updatedAt: timestamp }
      ],
      createdAt: timestamp,
      updatedAt: timestamp
    }
  ];
  
  const notices: NoticeMock[] = [];

  const settings: SettingMock[] = [
    { id: 'set-1', key: 'school_name', value: 'Angels World School', createdAt: timestamp, updatedAt: timestamp },
    { id: 'set-2', key: 'school_address', value: 'Sector 20, Panchkula, Haryana, India', createdAt: timestamp, updatedAt: timestamp },
    { id: 'set-3', key: 'school_phone', value: '+91 172 257 8899', createdAt: timestamp, updatedAt: timestamp },
    { id: 'set-4', key: 'school_email', value: 'info@angels.edu.in', createdAt: timestamp, updatedAt: timestamp },
    { id: 'set-5', key: 'active_session', value: '2026-2027', createdAt: timestamp, updatedAt: timestamp },
    { id: 'set-6', key: 'school_logo', value: '', createdAt: timestamp, updatedAt: timestamp }
  ];

  const logs: SystemLogMock[] = [];

  return { users, students, teachers, staff, fees, feeStructures, attendance, notices, settings, logs };
};

export class MockDatabase {
  private static data: MockSchema | null = null;

  private static load() {
    if (this.data) return;
    try {
      if (fs.existsSync(DB_FILE_PATH)) {
        const fileContent = fs.readFileSync(DB_FILE_PATH, 'utf-8');
        this.data = JSON.parse(fileContent);
      } else {
        this.data = getInitialData();
        this.save();
      }
    } catch (e) {
      console.error('Error loading mock database, building in-memory fallback', e);
      this.data = getInitialData();
    }
  }

  private static save() {
    if (!this.data) return;
    try {
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to write mock database file', e);
    }
  }

  public static get(): MockSchema {
    if (!isMockDataAllowed()) {
      throw new Error('Mock data fallback is disabled in production. Check DATABASE_URL and PostgreSQL availability.');
    }
    this.load();
    return this.data!;
  }

  public static update(updater: (data: MockSchema) => void) {
    if (!isMockDataAllowed()) {
      throw new Error('Mock data writes are disabled in production. Check DATABASE_URL and PostgreSQL availability.');
    }
    this.load();
    updater(this.data!);
    this.save();
  }
}
