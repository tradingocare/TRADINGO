const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.user.findMany({ select: { id: true, email: true, role: true, name: true } }).then(r => { console.log(JSON.stringify(r, null, 2)); p.$disconnect(); }).catch(e => { console.error(e.message); p.$disconnect(); })
