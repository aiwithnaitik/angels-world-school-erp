const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  console.log('Reading db.json...');
  const rawData = fs.readFileSync(path.join(__dirname, '../db.json'), 'utf-8');
  const data = JSON.parse(rawData);

  console.log('Seeding Database...');

  // 1. Clean existing data (optional, but good for a fresh start)
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "User", "Student", "Teacher", "Staff", "FeeStructure", "FeeComponent", "FeeRecord", "Attendance", "Notice", "Setting", "SystemLog" CASCADE;`);

  // 2. Seed Settings
  if (data.settings && data.settings.length > 0) {
    console.log(`Seeding ${data.settings.length} Settings...`);
    await prisma.setting.createMany({
      data: data.settings.map(s => ({
        id: s.id,
        key: s.key,
        value: s.value,
        createdAt: new Date(s.createdAt || Date.now()),
        updatedAt: new Date(s.updatedAt || Date.now())
      }))
    });
  }

  // 3. Seed Users
  if (data.users && data.users.length > 0) {
    console.log(`Seeding ${data.users.length} Users...`);
    await prisma.user.createMany({
      data: data.users.map(u => ({
        id: u.id,
        email: u.email,
        password: u.passwordHash, // Maps passwordHash from db.json to password field in DB
        name: u.name,
        role: u.role,
        isActive: u.isActive !== undefined ? u.isActive : true,
        createdAt: new Date(u.createdAt || Date.now()),
        updatedAt: new Date(u.updatedAt || Date.now())
      }))
    });
  }

  // 4. Seed Students
  if (data.students && data.students.length > 0) {
    console.log(`Seeding ${data.students.length} Students...`);
    await prisma.student.createMany({
      data: data.students.map(s => ({
        id: s.id,
        admissionNumber: s.admissionNumber,
        name: s.name,
        class: s.class,
        section: s.section,
        parentName: s.parentName,
        parentPhone: s.parentPhone,
        parentEmail: s.parentEmail || null,
        address: s.address,
        emergencyContact: s.emergencyContact || '',
        profileImage: s.profileImage || null,
        dateOfBirth: s.dateOfBirth || null,
        dateOfAdmission: s.dateOfAdmission || null,
        motherName: s.motherName || null,
        dateOfDeactivation: s.dateOfDeactivation || null,
        status: s.status || 'ACTIVE',
        createdAt: new Date(s.createdAt || Date.now()),
        updatedAt: new Date(s.updatedAt || Date.now())
      }))
    });
  }

  // 5. Seed Teachers
  if (data.teachers && data.teachers.length > 0) {
    console.log(`Seeding ${data.teachers.length} Teachers...`);
    for (const t of data.teachers) {
      // Find matching user ID by email if exists, to maintain relationship
      const user = data.users.find(u => u.email === t.email);
      await prisma.teacher.create({
        data: {
          id: t.id,
          name: t.name,
          email: t.email,
          phone: t.phone,
          subjects: t.subjects || [],
          classes: t.classes || [],
          profileImage: t.profileImage || null,
          userId: user ? user.id : null,
          createdAt: new Date(t.createdAt || Date.now()),
          updatedAt: new Date(t.updatedAt || Date.now())
        }
      });
    }
  }

  // 6. Seed Staff
  if (data.staff && data.staff.length > 0) {
    console.log(`Seeding ${data.staff.length} Staff...`);
    for (const s of data.staff) {
      const user = data.users.find(u => u.email === s.email);
      await prisma.staff.create({
        data: {
          id: s.id,
          name: s.name,
          email: s.email,
          phone: s.phone,
          roleName: s.roleName,
          permissions: s.permissions || [],
          userId: user ? user.id : null,
          createdAt: new Date(s.createdAt || Date.now()),
          updatedAt: new Date(s.updatedAt || Date.now())
        }
      });
    }
  }

  // 7. Seed Notices
  if (data.notices && data.notices.length > 0) {
    console.log(`Seeding ${data.notices.length} Notices...`);
    await prisma.notice.createMany({
      data: data.notices.map(n => ({
        id: n.id,
        title: n.title,
        content: n.content,
        category: n.category,
        author: n.author,
        isActive: n.isActive !== undefined ? n.isActive : true,
        createdAt: new Date(n.createdAt || Date.now()),
        updatedAt: new Date(n.updatedAt || Date.now())
      }))
    });
  }

  // 8. Seed Fee Structures and Components
  if (data.feeStructures && data.feeStructures.length > 0) {
    console.log(`Seeding ${data.feeStructures.length} Fee Structures...`);
    for (const fsItem of data.feeStructures) {
      const createdStructure = await prisma.feeStructure.create({
        data: {
          id: fsItem.id,
          class: fsItem.class,
          studentType: fsItem.studentType,
          academicYear: fsItem.academicYear,
          totalFees: fsItem.totalFees,
          admissionFee: fsItem.admissionFee || 0,
          createdAt: new Date(fsItem.createdAt || Date.now()),
          updatedAt: new Date(fsItem.updatedAt || Date.now())
        }
      });

      if (fsItem.components && fsItem.components.length > 0) {
        await prisma.feeComponent.createMany({
          data: fsItem.components.map(c => ({
            id: c.id,
            feeStructureId: createdStructure.id,
            name: c.name,
            amount: c.amount,
            dueMonth: c.dueMonth,
            sequence: c.sequence,
            createdAt: new Date(c.createdAt || Date.now()),
            updatedAt: new Date(c.updatedAt || Date.now())
          }))
        });
      }
    }
  }

  // 9. Seed Fee Records
  if (data.fees && data.fees.length > 0) {
    console.log(`Seeding ${data.fees.length} Fee Records...`);
    // Due to scale, createMany is much faster here
    const batches = [];
    const batchSize = 1000;
    
    const formattedFees = data.fees.map(f => ({
      id: f.id,
      studentId: f.studentId,
      amount: f.amount,
      dueDate: new Date(f.dueDate),
      paidAmount: f.paidAmount || 0,
      balance: f.balance,
      status: f.status,
      paymentDate: f.paymentDate ? new Date(f.paymentDate) : null,
      paymentMethod: f.paymentMethod || null,
      receiptNumber: f.receiptNumber || null,
      remarks: f.remarks || null,
      componentName: f.componentName || null,
      academicYear: f.academicYear || null,
      createdAt: new Date(f.createdAt || Date.now()),
      updatedAt: new Date(f.updatedAt || Date.now())
    }));

    for (let i = 0; i < formattedFees.length; i += batchSize) {
      batches.push(formattedFees.slice(i, i + batchSize));
    }

    for (const batch of batches) {
      await prisma.feeRecord.createMany({ data: batch });
    }
  }

  // 10. Seed Attendance Records
  if (data.attendance && data.attendance.length > 0) {
    console.log(`Seeding ${data.attendance.length} Attendance Records...`);
    const batches = [];
    const batchSize = 1000;

    const formattedAttendance = data.attendance.map(a => ({
      id: a.id,
      date: new Date(a.date),
      status: a.status,
      studentId: a.studentId,
      class: a.class,
      section: a.section,
      markedBy: a.markedBy,
      createdAt: new Date(a.createdAt || Date.now()),
      updatedAt: new Date(a.updatedAt || Date.now())
    }));

    for (let i = 0; i < formattedAttendance.length; i += batchSize) {
      batches.push(formattedAttendance.slice(i, i + batchSize));
    }

    for (const batch of batches) {
      await prisma.attendance.createMany({ data: batch });
    }
  }

  console.log('Database Seeding Completed Successfully!');
}

main()
  .catch((e) => {
    console.error('Error during database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
