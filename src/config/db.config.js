import { PrismaClient } from "@prisma/client";

// Prevent multiple instances in development due to hot reloading
const globalForPrisma = global;

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["query"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // Add connection pooling configuration
    connection: {
      pool: {
        min: 2,
        max: 10,
      },
    },
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;