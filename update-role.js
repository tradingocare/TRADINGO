const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.user.updateMany({ where: { email: { in: ['newtest@tradingo.com', 'seller2@tradingo.com'] } }, data: { role: 'BUYER' } }).then(r => { console.log('Updated to BUYER:', r); return p.user.update({ where: { email: 'seller2@tradingo.com' }, data: { role: 'SELLER' } }); }).then(r => { console.log('Updated seller2 to SELLER:', r.role); return p.user.findMany({ select: { email: true, role: true } }); }).then(r => { console.log(JSON.stringify(r)); p.$disconnect(); }).catch(e => { console.error(e); p.$disconnect(); });
