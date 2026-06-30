import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('[Seed]: Starting database seeding...');

  // 0. Clean up existing data to avoid FK constraint violations
  await prisma.comment.deleteMany({});
  await prisma.timelineEvent.deleteMany({});
  await prisma.complaint.deleteMany({});

  // 1. Seed AAI Departments
  const departmentsData = [
    'Operations',
    'Air Traffic Control (ATC)',
    'Communication, Navigation & Surveillance (CNS)',
    'Information Technology (IT)',
    'Corporate Planning & Management Services (CP&MS)',
    'Human Resources (HR)',
    'Administration',
  ];
  const departments: Record<string, any> = {};

  for (const name of departmentsData) {
    departments[name] = await prisma.department.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log(`[Seed]: Seeded ${departmentsData.length} departments.`);

  // 2. Seed Categories
  const categoriesData = [
    'Hardware',
    'Software',
    'Network',
    'Access / Permissions',
    'Facilities',
    'Others',
  ];
  const categories: Record<string, any> = {};
  for (const name of categoriesData) {
    categories[name] = await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log(`[Seed]: Seeded ${categoriesData.length} categories.`);

  // 3. Hash default passwords
  const adminPasswordHash = await bcrypt.hash('adminpassword', 10);
  const employeePasswordHash = await bcrypt.hash('employeepassword', 10);

  // 4. Remove any stale/extra test users (besides the two official accounts)
  await prisma.user.deleteMany({
    where: {
      email: { notIn: ['admin@portal.com', 'employee@portal.com'] },
    },
  });

  // 5. Seed IT Admin — KRISH MEHTA
  const admin = await prisma.user.upsert({
    where: { email: 'admin@portal.com' },
    update: {
      name: 'KRISH MEHTA',
      departmentId: departments['Information Technology (IT)'].id,
    },
    create: {
      email: 'admin@portal.com',
      passwordHash: adminPasswordHash,
      name: 'KRISH MEHTA',
      employeeId: 'EMP-00001',
      role: 'ADMIN',
      departmentId: departments['Information Technology (IT)'].id,
    },
  });
  console.log(`[Seed]: Seeded IT Admin Account: ${admin.email}`);

  // 6. Seed Employee — BHAVYA MEHTA
  const employee = await prisma.user.upsert({
    where: { email: 'employee@portal.com' },
    update: {
      name: 'BHAVYA MEHTA',
      departmentId: departments['Operations'].id,
    },
    create: {
      email: 'employee@portal.com',
      passwordHash: employeePasswordHash,
      name: 'BHAVYA MEHTA',
      employeeId: 'EMP-00002',
      role: 'EMPLOYEE',
      departmentId: departments['Operations'].id,
    },
  });
  console.log(`[Seed]: Seeded Employee Account: ${employee.email}`);

  // 7. Seed sample complaints with realistic June 2026 dates
  const complaintsData = [
    {
      ticketNo: 'COMP-1001001',
      subject: 'Laptop screen flickering constantly',
      description:
        'My Dell laptop screen has been flickering for the past 3 days. It becomes worse when connected to an external monitor. This is severely impacting my productivity. I have tried restarting the laptop and updating display drivers but the issue persists.',
      categoryId: categories['Hardware'].id,
      departmentId: departments['Operations'].id,
      employeeId: employee.id,
      priority: 'HIGH' as const,
      status: 'IN_PROGRESS' as const,
      assignedEngineerId: admin.id,
      createdAt: new Date('2026-06-03T09:15:00Z'),
    },
    {
      ticketNo: 'COMP-1001002',
      subject: 'Cannot access company VPN from home',
      description:
        'I have been unable to connect to the company VPN since yesterday evening. I am working remotely and this is blocking me from accessing all internal resources. The error message says Authentication failed. I have tried reinstalling the VPN client.',
      categoryId: categories['Network'].id,
      departmentId: departments['Information Technology (IT)'].id,
      employeeId: employee.id,
      priority: 'CRITICAL' as const,
      status: 'ASSIGNED' as const,
      assignedEngineerId: admin.id,
      createdAt: new Date('2026-06-07T11:30:00Z'),
    },
    {
      ticketNo: 'COMP-1001003',
      subject: 'Microsoft Office license expired',
      description:
        'My Microsoft Office license has expired and I am now unable to edit any Word or Excel documents. I receive a subscription expired warning every time I open any Office application. This is preventing me from completing my daily work.',
      categoryId: categories['Software'].id,
      departmentId: departments['Administration'].id,
      employeeId: employee.id,
      priority: 'MEDIUM' as const,
      status: 'OPEN' as const,
      createdAt: new Date('2026-06-11T14:00:00Z'),
    },
    {
      ticketNo: 'COMP-1001004',
      subject: 'Printer not connecting to network',
      description:
        'The shared printer on the 3rd floor is not connecting to the network. Multiple employees have reported being unable to print documents. The printer shows as offline in the print queue. We have already tried power cycling the printer.',
      categoryId: categories['Hardware'].id,
      departmentId: departments['Human Resources (HR)'].id,
      employeeId: employee.id,
      priority: 'MEDIUM' as const,
      status: 'RESOLVED' as const,
      resolutionNotes: 'Replaced the network card in the printer and reconfigured IP settings.',
      createdAt: new Date('2026-06-14T10:20:00Z'),
    },
    {
      ticketNo: 'COMP-1001005',
      subject: 'Email account hacked - urgent security issue',
      description:
        'I believe my corporate email account has been compromised. I noticed several outgoing emails I did not send, and my password was changed without my knowledge. This is a critical security incident that needs immediate attention.',
      categoryId: categories['Access / Permissions'].id,
      departmentId: departments['Corporate Planning & Management Services (CP&MS)'].id,
      employeeId: employee.id,
      priority: 'CRITICAL' as const,
      status: 'CLOSED' as const,
      resolutionNotes:
        'Account secured, password reset, 2FA enabled, and incident logged with security team.',
      createdAt: new Date('2026-06-18T08:45:00Z'),
    },
    {
      ticketNo: 'COMP-1001006',
      subject: 'Slow internet speed at workstation',
      description:
        'Internet speed at my workstation has been extremely slow for the past week. Pages take 30+ seconds to load and video calls keep dropping. Other workstations nearby seem to work fine.',
      categoryId: categories['Network'].id,
      departmentId: departments['Air Traffic Control (ATC)'].id,
      employeeId: employee.id,
      priority: 'LOW' as const,
      status: 'OPEN' as const,
      createdAt: new Date('2026-06-22T13:15:00Z'),
    },
  ];

  for (const data of complaintsData) {
    const { createdAt, ...rest } = data;
    await prisma.complaint.create({
      data: {
        ...rest,
        createdAt,
        timelineEvents: {
          create: [
            { userId: data.employeeId, message: 'Complaint submitted successfully.', createdAt },
            ...(data.assignedEngineerId
              ? [{ userId: admin.id, message: `Complaint assigned to ${admin.name}.`, createdAt: new Date(createdAt.getTime() + 30 * 60 * 1000) }]
              : []),
            ...(data.status === 'RESOLVED' || data.status === 'CLOSED'
              ? [{ userId: admin.id, message: `Status updated to "${data.status}".`, createdAt: new Date(createdAt.getTime() + 2 * 24 * 60 * 60 * 1000) }]
              : []),
          ],
        },
      },
    });
  }
  console.log(`[Seed]: Seeded ${complaintsData.length} sample complaints.`);

  console.log('[Seed]: Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('[Seed - Error]: Seeding failed with error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
