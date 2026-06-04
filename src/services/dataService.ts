import { prisma, checkDatabaseConnection } from '../lib/db';
import bcrypt from 'bcryptjs';
import { MockDatabase } from '../lib/mockDb';
import { Role, FeeStatus, AttendanceStatus } from '@prisma/client';

let isDbAvailable = false;

const generateTemporaryPassword = () => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@$%';
  return Array.from({ length: 14 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
};

// Run self-check asynchronously on load
checkDatabaseConnection().then(available => {
  isDbAvailable = available;
});

// A unified service layer that queries PostgreSQL via Prisma if connected,
// otherwise falls back seamlessly to the persistent mock JSON database.
export const DataService = {
  // --- USER METHODS ---
  async getUserByEmail(email: string) {
    if (isDbAvailable) {
      try {
        return await prisma.user.findUnique({ where: { email } });
      } catch {
        // Fail-safe fallback
      }
    }
    const mock = MockDatabase.get();
    const user = mock.users.find(u => u.email === email && u.isActive);
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      password: user.passwordHash,
      name: user.name,
      role: user.role as Role,
      isActive: user.isActive,
      createdAt: new Date(user.createdAt),
      updatedAt: new Date(user.updatedAt)
    };
  },

  async getUsers() {
    if (isDbAvailable) {
      try {
        return await prisma.user.findMany({ orderBy: { name: 'asc' } });
      } catch {}
    }
    const mock = MockDatabase.get();
    return mock.users.map(u => ({
      ...u,
      password: u.passwordHash,
      role: u.role as Role,
      createdAt: new Date(u.createdAt),
      updatedAt: new Date(u.updatedAt)
    }));
  },

  async createUser(data: { email: string; passwordHash: string; name: string; role: Role }) {
    if (isDbAvailable) {
      try {
        return await prisma.user.create({
          data: {
            email: data.email,
            password: data.passwordHash,
            name: data.name,
            role: data.role
          }
        });
      } catch {}
    }
    let newUser: any;
    MockDatabase.update((mock) => {
      newUser = {
        id: 'u-' + Math.random().toString(36).substr(2, 9),
        email: data.email,
        passwordHash: data.passwordHash,
        name: data.name,
        role: data.role,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      mock.users.push(newUser);
    });
    return newUser;
  },

  // --- STUDENT METHODS ---
  async getStudents() {
    if (isDbAvailable) {
      try {
        return await prisma.student.findMany({
          orderBy: { name: 'asc' }
        });
      } catch {}
    }
    const mock = MockDatabase.get();
    return mock.students.map(s => ({
      ...s,
      createdAt: new Date(s.createdAt),
      updatedAt: new Date(s.updatedAt)
    }));
  },

  async getStudentById(id: string) {
    if (isDbAvailable) {
      try {
        return await prisma.student.findUnique({ where: { id } });
      } catch {}
    }
    const mock = MockDatabase.get();
    const student = mock.students.find(s => s.id === id);
    if (!student) return null;
    return {
      ...student,
      createdAt: new Date(student.createdAt),
      updatedAt: new Date(student.updatedAt)
    };
  },

  async createStudent(data: {
    name: string;
    class: string;
    section: string;
    parentName: string;
    parentPhone: string;
    parentEmail?: string;
    address: string;
    emergencyContact: string;
    profileImage?: string;
    admissionNumber?: string;
    dateOfBirth?: string;
    dateOfAdmission?: string;
    motherName?: string;
    dateOfDeactivation?: string;
  }) {
    const nextAdmNo = data.admissionNumber || `AWS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    if (isDbAvailable) {
      try {
        return await prisma.student.create({
          data: {
            ...data,
            admissionNumber: nextAdmNo
          }
        });
      } catch {}
    }
    let newStudent: any;
    MockDatabase.update((mock) => {
      newStudent = {
        id: 's-' + Math.random().toString(36).substr(2, 9),
        admissionNumber: nextAdmNo,
        name: data.name,
        class: data.class,
        section: data.section,
        parentName: data.parentName,
        parentPhone: data.parentPhone,
        parentEmail: data.parentEmail || '',
        address: data.address,
        emergencyContact: data.emergencyContact,
        profileImage: data.profileImage || '',
        dateOfBirth: data.dateOfBirth || '',
        dateOfAdmission: data.dateOfAdmission || '',
        motherName: data.motherName || '',
        dateOfDeactivation: data.dateOfDeactivation || '',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      mock.students.push(newStudent);

      // Create a standard blank fee record for new student
      mock.fees.push({
        id: 'f-fee-' + Math.random().toString(36).substr(2, 9),
        studentId: newStudent.id,
        amount: 15000,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        paidAmount: 0,
        balance: 15000,
        status: 'UNPAID',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    });
    return newStudent;
  },

  async updateStudent(id: string, data: Partial<any>) {
    if (isDbAvailable) {
      try {
        return await prisma.student.update({
          where: { id },
          data
        });
      } catch {}
    }
    let updated: any = null;
    MockDatabase.update((mock) => {
      const idx = mock.students.findIndex(s => s.id === id);
      if (idx !== -1) {
        mock.students[idx] = {
          ...mock.students[idx],
          ...data,
          updatedAt: new Date().toISOString()
        };
        updated = mock.students[idx];
      }
    });
    return updated;
  },

  async deleteStudent(id: string) {
    if (isDbAvailable) {
      try {
        return await prisma.student.delete({ where: { id } });
      } catch {}
    }
    let deleted = false;
    MockDatabase.update((mock) => {
      const before = mock.students.length;
      mock.students = mock.students.filter(s => s.id !== id);
      mock.fees = mock.fees.filter(f => f.studentId !== id);
      mock.attendance = mock.attendance.filter(a => a.studentId !== id);
      if (mock.students.length < before) deleted = true;
    });
    return deleted;
  },

  // --- TEACHER METHODS ---
  async getTeachers() {
    if (isDbAvailable) {
      try {
        return await prisma.teacher.findMany({ orderBy: { name: 'asc' } });
      } catch {}
    }
    const mock = MockDatabase.get();
    return mock.teachers.map(t => ({
      ...t,
      createdAt: new Date(t.createdAt),
      updatedAt: new Date(t.updatedAt)
    }));
  },

  async createTeacher(data: {
    name: string;
    email: string;
    phone: string;
    subjects: string[];
    classes: string[];
  }) {
    const temporaryPassword = generateTemporaryPassword();
    if (isDbAvailable) {
      try {
        const hash = bcrypt.hashSync(temporaryPassword, 10);
        const user = await prisma.user.create({
          data: {
            email: data.email,
            password: hash,
            name: data.name,
            role: 'TEACHER'
          }
        });
        const teacher = await prisma.teacher.create({
          data: {
            ...data,
            userId: user.id
          }
        });
        return { ...teacher, temporaryPassword };
      } catch {}
    }
    let newTeacher: any;
    MockDatabase.update((mock) => {
      newTeacher = {
        id: 't-' + Math.random().toString(36).substr(2, 9),
        name: data.name,
        email: data.email,
        phone: data.phone,
        subjects: data.subjects,
        classes: data.classes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      mock.teachers.push(newTeacher);

      // Create linked login account
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(temporaryPassword, salt);
      mock.users.push({
        id: 'u-' + Math.random().toString(36).substr(2, 9),
        email: data.email,
        passwordHash: hash,
        name: data.name,
        role: 'TEACHER',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    });
    return { ...newTeacher, temporaryPassword };
  },

  async updateTeacher(id: string, data: Partial<any>) {
    if (isDbAvailable) {
      try {
        return await prisma.teacher.update({ where: { id }, data });
      } catch {}
    }
    let updated: any = null;
    MockDatabase.update((mock) => {
      const idx = mock.teachers.findIndex(t => t.id === id);
      if (idx !== -1) {
        mock.teachers[idx] = {
          ...mock.teachers[idx],
          ...data,
          updatedAt: new Date().toISOString()
        };
        updated = mock.teachers[idx];
      }
    });
    return updated;
  },

  async deleteTeacher(id: string) {
    if (isDbAvailable) {
      try {
        return await prisma.teacher.delete({ where: { id } });
      } catch {}
    }
    let deleted = false;
    MockDatabase.update((mock) => {
      const teacher = mock.teachers.find(t => t.id === id);
      if (teacher) {
        mock.teachers = mock.teachers.filter(t => t.id !== id);
        if (teacher.email) {
          mock.users = mock.users.filter(u => u.email !== teacher.email);
        }
        deleted = true;
      }
    });
    return deleted;
  },

  // --- STAFF METHODS ---
  async getStaff() {
    if (isDbAvailable) {
      try {
        return await prisma.staff.findMany({ orderBy: { name: 'asc' } });
      } catch {}
    }
    const mock = MockDatabase.get();
    return mock.staff.map(s => ({
      ...s,
      createdAt: new Date(s.createdAt),
      updatedAt: new Date(s.updatedAt)
    }));
  },

  async createStaff(data: {
    name: string;
    email: string;
    phone: string;
    roleName: string;
    permissions: string[];
  }) {
    const temporaryPassword = generateTemporaryPassword();
    if (isDbAvailable) {
      try {
        const roleEnum = data.roleName.toUpperCase() === 'ACCOUNTANT' ? 'ACCOUNTANT' : 'STAFF';
        const hash = bcrypt.hashSync(temporaryPassword, 10);
        const user = await prisma.user.create({
          data: {
            email: data.email,
            password: hash,
            name: data.name,
            role: roleEnum
          }
        });
        const staff = await prisma.staff.create({
          data: {
            ...data,
            userId: user.id
          }
        });
        return { ...staff, temporaryPassword };
      } catch {}
    }
    let newStaff: any;
    MockDatabase.update((mock) => {
      newStaff = {
        id: 'st-' + Math.random().toString(36).substr(2, 9),
        name: data.name,
        email: data.email,
        phone: data.phone,
        roleName: data.roleName,
        permissions: data.permissions,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      mock.staff.push(newStaff);

      // Create linked login account based on role name
      const roleEnum = data.roleName.toUpperCase() === 'ACCOUNTANT' ? 'ACCOUNTANT' : 'STAFF';
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(temporaryPassword, salt);
      mock.users.push({
        id: 'u-' + Math.random().toString(36).substr(2, 9),
        email: data.email,
        passwordHash: hash,
        name: data.name,
        role: roleEnum as Role,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    });
    return { ...newStaff, temporaryPassword };
  },

  async updateStaff(id: string, data: Partial<any>) {
    if (isDbAvailable) {
      try {
        return await prisma.staff.update({ where: { id }, data });
      } catch {}
    }
    let updated: any = null;
    MockDatabase.update((mock) => {
      const idx = mock.staff.findIndex(s => s.id === id);
      if (idx !== -1) {
        mock.staff[idx] = {
          ...mock.staff[idx],
          ...data,
          updatedAt: new Date().toISOString()
        };
        updated = mock.staff[idx];
      }
    });
    return updated;
  },

  async deleteStaff(id: string) {
    if (isDbAvailable) {
      try {
        return await prisma.staff.delete({ where: { id } });
      } catch {}
    }
    let deleted = false;
    MockDatabase.update((mock) => {
      const record = mock.staff.find(s => s.id === id);
      if (record) {
        mock.staff = mock.staff.filter(s => s.id !== id);
        if (record.email) {
          mock.users = mock.users.filter(u => u.email !== record.email);
        }
        deleted = true;
      }
    });
    return deleted;
  },

  // --- FEE METHODS ---
  async getFees() {
    if (isDbAvailable) {
      try {
        return await prisma.feeRecord.findMany({
          include: { student: true },
          orderBy: { dueDate: 'asc' }
        });
      } catch {}
    }
    const mock = MockDatabase.get();
    return mock.fees.map(f => {
      const student = mock.students.find(s => s.id === f.studentId);
      return {
        ...f,
        status: f.status as FeeStatus,
        dueDate: new Date(f.dueDate),
        paymentDate: f.paymentDate ? new Date(f.paymentDate) : null,
        createdAt: new Date(f.createdAt),
        updatedAt: new Date(f.updatedAt),
        student: student ? { ...student, createdAt: new Date(student.createdAt), updatedAt: new Date(student.updatedAt) } : null
      };
    });
  },

  async createFeeRecord(studentId: string, amount: number, dueDate: Date, remarks?: string) {
    if (isDbAvailable) {
      try {
        return await prisma.feeRecord.create({
          data: {
            studentId,
            amount,
            dueDate,
            paidAmount: 0,
            balance: amount,
            status: 'UNPAID',
            remarks: remarks || ''
          }
        });
      } catch {}
    }
    let newRecord: any = null;
    MockDatabase.update((mock) => {
      newRecord = {
        id: 'f-fee-' + Math.random().toString(36).substr(2, 9),
        studentId,
        amount,
        dueDate: dueDate.toISOString(),
        paidAmount: 0,
        balance: amount,
        status: 'UNPAID',
        remarks: remarks || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      mock.fees.push(newRecord);
    });
    return newRecord;
  },

  async createFeePayment(feeId: string, payAmount: number, method: string, remarks?: string) {
    if (isDbAvailable) {
      try {
        const record = await prisma.feeRecord.findUnique({ where: { id: feeId } });
        if (record) {
          const newPaid = record.paidAmount + payAmount;
          const newBal = Math.max(0, record.amount - newPaid);
          const newStatus: FeeStatus = newBal === 0 ? 'PAID' : 'PARTIAL';
          return await prisma.feeRecord.update({
            where: { id: feeId },
            data: {
              paidAmount: newPaid,
              balance: newBal,
              status: newStatus,
              paymentDate: new Date(),
              paymentMethod: method,
              remarks: remarks || '',
              receiptNumber: `REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
            }
          });
        }
      } catch {}
    }
    let updated: any = null;
    MockDatabase.update((mock) => {
      const idx = mock.fees.findIndex(f => f.id === feeId);
      if (idx !== -1) {
        const item = mock.fees[idx];
        const newPaid = item.paidAmount + payAmount;
        const newBal = Math.max(0, item.amount - newPaid);
        const newStatus = newBal === 0 ? 'PAID' : 'PARTIAL';
        mock.fees[idx] = {
          ...item,
          paidAmount: newPaid,
          balance: newBal,
          status: newStatus as any,
          paymentDate: new Date().toISOString(),
          paymentMethod: method,
          remarks: remarks || '',
          receiptNumber: `REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
          updatedAt: new Date().toISOString()
        };
        updated = mock.fees[idx];
      }
    });
    return updated;
  },

  // --- ATTENDANCE METHODS ---
  async getAttendance(date: string) {
    if (isDbAvailable) {
      try {
        return await prisma.attendance.findMany({
          where: {
            date: new Date(date)
          },
          include: { student: true }
        });
      } catch {}
    }
    const mock = MockDatabase.get();
    return mock.attendance
      .filter(a => a.date === date)
      .map(a => {
        const student = mock.students.find(s => s.id === a.studentId);
        return {
          ...a,
          status: a.status as AttendanceStatus,
          date: new Date(a.date),
          createdAt: new Date(a.createdAt),
          updatedAt: new Date(a.updatedAt),
          student: student ? { ...student, createdAt: new Date(student.createdAt), updatedAt: new Date(student.updatedAt) } : null
        };
      });
  },

  async markAttendance(records: { studentId: string; status: AttendanceStatus; class: string; section: string; date: string; markedBy: string }[]) {
    if (isDbAvailable) {
      try {
        // Upsert standard attendance records in PostgreSQL
        const ops = records.map(r => prisma.attendance.upsert({
          where: {
            date_studentId: {
              date: new Date(r.date),
              studentId: r.studentId
            }
          },
          update: {
            status: r.status,
            markedBy: r.markedBy
          },
          create: {
            date: new Date(r.date),
            studentId: r.studentId,
            status: r.status,
            class: r.class,
            section: r.section,
            markedBy: r.markedBy
          }
        }));
        await prisma.$transaction(ops);
        return true;
      } catch (err) {
        console.error('Prisma markAttendance failed:', err);
      }
    }
    
    MockDatabase.update((mock) => {
      records.forEach(r => {
        const existIdx = mock.attendance.findIndex(a => a.date === r.date && a.studentId === r.studentId);
        if (existIdx !== -1) {
          mock.attendance[existIdx] = {
            ...mock.attendance[existIdx],
            status: r.status as any,
            markedBy: r.markedBy,
            updatedAt: new Date().toISOString()
          };
        } else {
          mock.attendance.push({
            id: 'att-' + Math.random().toString(36).substr(2, 9),
            date: r.date,
            status: r.status as any,
            studentId: r.studentId,
            class: r.class,
            section: r.section,
            markedBy: r.markedBy,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
      });
    });
    return true;
  },

  // --- NOTICES METHODS ---
  async getNotices() {
    if (isDbAvailable) {
      try {
        return await prisma.notice.findMany({
          where: { isActive: true },
          orderBy: { createdAt: 'desc' }
        });
      } catch {}
    }
    const mock = MockDatabase.get();
    return mock.notices
      .filter(n => n.isActive)
      .map(n => ({
        ...n,
        createdAt: new Date(n.createdAt),
        updatedAt: new Date(n.updatedAt)
      }));
  },

  async createNotice(data: { title: string; content: string; category: string; author: string }) {
    if (isDbAvailable) {
      try {
        return await prisma.notice.create({ data });
      } catch {}
    }
    let newNotice: any;
    MockDatabase.update((mock) => {
      newNotice = {
        id: 'n-' + Math.random().toString(36).substr(2, 9),
        title: data.title,
        content: data.content,
        category: data.category,
        author: data.author,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      mock.notices.unshift(newNotice);
    });
    return newNotice;
  },

  // --- SETTINGS METHODS ---
  async getSettings() {
    if (isDbAvailable) {
      try {
        const rows = await prisma.setting.findMany();
        return rows.reduce((acc: Record<string, string>, item) => {
          acc[item.key] = item.value;
          return acc;
        }, {});
      } catch {}
    }
    const mock = MockDatabase.get();
    return mock.settings.reduce((acc: Record<string, string>, item) => {
      acc[item.key] = item.value;
      return acc;
    }, {});
  },

  async updateSetting(key: string, value: string) {
    if (isDbAvailable) {
      try {
        return await prisma.setting.upsert({
          where: { key },
          update: { value },
          create: { key, value }
        });
      } catch {}
    }
    MockDatabase.update((mock) => {
      const idx = mock.settings.findIndex(s => s.key === key);
      if (idx !== -1) {
        mock.settings[idx].value = value;
        mock.settings[idx].updatedAt = new Date().toISOString();
      } else {
        mock.settings.push({
          id: 'set-' + Math.random().toString(36).substr(2, 9),
          key,
          value,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    });
    return { key, value };
  },

  // --- FEE STRUCTURE METHODS ---
  async getFeeStructures(academicYear?: string) {
    if (isDbAvailable) {
      try {
        let where = {};
        if (academicYear) where = { academicYear };
        return await prisma.feeStructure.findMany({
          where,
          include: { components: { orderBy: { sequence: 'asc' } } },
          orderBy: { class: 'asc' }
        });
      } catch {}
    }
    const mock = MockDatabase.get();
    let structures = mock.feeStructures || [];
    if (academicYear) {
      structures = structures.filter(fs => fs.academicYear === academicYear);
    }
    return structures.map(fs => ({
      ...fs,
      createdAt: new Date(fs.createdAt),
      updatedAt: new Date(fs.updatedAt),
      components: fs.components
        .sort((a, b) => a.sequence - b.sequence)
        .map(c => ({ ...c, createdAt: new Date(c.createdAt), updatedAt: new Date(c.updatedAt) }))
    }));
  },

  async getFeeStructureByClassAndType(className: string, studentType: string, academicYear: string) {
    if (isDbAvailable) {
      try {
        return await prisma.feeStructure.findUnique({
          where: {
            class_studentType_academicYear: {
              class: className,
              studentType,
              academicYear
            }
          },
          include: { components: { orderBy: { sequence: 'asc' } } }
        });
      } catch {}
    }
    const mock = MockDatabase.get();
    const structure = (mock.feeStructures || []).find(fs => 
      fs.class === className && 
      fs.studentType === studentType && 
      fs.academicYear === academicYear
    );
    if (!structure) return null;
    return {
      ...structure,
      createdAt: new Date(structure.createdAt),
      updatedAt: new Date(structure.updatedAt),
      components: structure.components
        .sort((a, b) => a.sequence - b.sequence)
        .map(c => ({ ...c, createdAt: new Date(c.createdAt), updatedAt: new Date(c.updatedAt) }))
    };
  },

  async createLog(action: string, details: string, userId?: string) {
    if (isDbAvailable) {
      try {
        return await prisma.systemLog.create({
          data: { action, details, userId }
        });
      } catch {}
    }
    let newLog: any;
    MockDatabase.update((mock) => {
      newLog = {
        id: 'log-' + Math.random().toString(36).substr(2, 9),
        action,
        details,
        userId: userId || null,
        createdAt: new Date().toISOString()
      };
      mock.logs.push(newLog);
    });
    return newLog;
  },

  // --- SYSTEM LOGS METHODS ---
  async getLogs(limit = 20) {
    if (isDbAvailable) {
      try {
        return await prisma.systemLog.findMany({
          orderBy: { createdAt: 'desc' },
          take: limit,
          include: { user: true }
        });
      } catch {}
    }
    const mock = MockDatabase.get();
    return mock.logs
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit)
      .map(l => {
        const user = mock.users.find(u => u.id === l.userId);
        return {
          ...l,
          createdAt: new Date(l.createdAt),
          user: user ? { id: user.id, name: user.name, role: user.role } : null
        };
      });
  }
};
