// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const prisma = global.prisma || new PrismaClient({
  // log: ['query', 'info', 'warn', 'error'], // Optionnel: pour voir les logs Prisma
});

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export default prisma;