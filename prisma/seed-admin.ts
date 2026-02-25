import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('admin1234', 10);
  await prisma.user.upsert({
    where: { email: 'admin@wera-access.com' },
    update: {},
    create: {
      estateUniqueId: 'admin-001',
      role: 'ADMIN',
      status: 'APPROVED',
      fullName: 'Admin User',
      email: 'admin@wera-access.com',
      phone: '08000000000',
      password,
      address: 'Estate Admin Office',
    },
  });
  console.log('Seeded admin user: admin@wera-access.com / admin1234');
}

main().finally(() => prisma.$disconnect());
