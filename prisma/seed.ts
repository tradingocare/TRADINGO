import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@tradingo.io';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin@1234';

  const adminHash = await bcrypt.hash(adminPassword, 12);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: adminHash,
      name: 'Super Admin',
      role: Role.SUPER_ADMIN,
      permissions: ['*'],
      emailVerifiedAt: new Date(),
    },
  });
  console.log(`SUPER_ADMIN created: ${adminEmail}`);

  const testHash = await bcrypt.hash('Test@1234', 12);
  await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      passwordHash: testHash,
      name: 'Test Admin',
      role: Role.ADMIN,
      permissions: ['users:read', 'users:write'],
      emailVerifiedAt: new Date(),
    },
  });
  console.log('ADMIN created: test@example.com');

  for (let i = 1; i <= 10; i++) {
    const email = `user${i}@example.com`;
    const viewerHash = await bcrypt.hash('Viewer@1234', 12);
    await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        passwordHash: viewerHash,
        name: `Viewer User ${i}`,
        role: Role.VIEWER,
        permissions: [],
        emailVerifiedAt: new Date(),
      },
    });
  }
  console.log('10 VIEWER users created');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
