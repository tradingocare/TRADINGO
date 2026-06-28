import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 1. Find or create a user
  let user = await prisma.user.findUnique({ where: { email: 'sample@tradingo.io' } })
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: 'sample@tradingo.io',
        passwordHash: '$2b$12$dummy', // not meant for login
        name: 'Sample Supplier',
        role: Role.VIEWER,
        emailVerifiedAt: new Date(),
      },
    })
    console.log('Created user:', user.id)
  }

  // 2. Check if sample company already exists
  const existing = await prisma.company.findUnique({ where: { slug: 'sample-manufacturers-pvt-ltd' } })
  if (existing) {
    console.log('Sample company already exists at slug: sample-manufacturers-pvt-ltd')
    return
  }

  // 3. Create company
  const company = await prisma.company.create({
    data: {
      name: 'Sample Manufacturers Pvt. Ltd.',
      slug: 'sample-manufacturers-pvt-ltd',
      logo: null,
      banner: null,
      description: 'Sample Manufacturers is a leading B2B supplier of industrial equipment and machinery based in Mumbai, India. With over 15 years of experience, we serve clients across India, Middle East, and Southeast Asia.',
      businessType: 'MANUFACTURER',
      establishedYear: 2009,
      employeeCount: 250,
      gstNumber: '27AABCS1234E1Z5',
      panNumber: 'AABCS1234E',
      website: 'https://sample-mfg.example.com',
      email: 'contact@sample-mfg.example.com',
      mobile: '+91-9876543210',
      trustScore: 87,
      verificationLevel: 'LEVEL_3',
      geographicReach: 'GLOBAL',
      status: 'ACTIVE',
      totalProducts: 340,
      responseRate: 94,
      goCashBalance: 25000,
      certifications: JSON.stringify([
        { name: 'ISO 9001:2015', issuedBy: 'BIS', year: 2020 },
        { name: 'CE Marking', issuedBy: 'EU', year: 2021 },
      ]),
      createdBy: user.id,
      updatedBy: user.id,
    },
  })
  console.log('Created company:', company.id, company.name)

  // 4. Create location
  await prisma.companyLocation.create({
    data: {
      companyId: company.id,
      type: 'HEAD_OFFICE',
      addressLine1: 'Plot No. 42, MIDC Industrial Area',
      addressLine2: 'Andheri East',
      city: 'Mumbai',
      district: 'Mumbai Suburban',
      state: 'Maharashtra',
      country: 'India',
      pincode: '400093',
      isPrimary: true,
    },
  })
  console.log('Created location: Mumbai, Maharashtra')

  // 5. Add owner
  await prisma.companyOwner.create({
    data: {
      companyId: company.id,
      userId: user.id,
      isPrimary: true,
    },
  })
  console.log('Added owner')

  console.log('\n✅ Sample company ready!')
  console.log('   Directory: http://localhost:3000/companies')
  console.log('   Profile:   http://localhost:3000/companies/sample-manufacturers-pvt-ltd')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
