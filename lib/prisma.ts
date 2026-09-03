import { PrismaClient } from "@prisma/client"

/**
 * Standard Next.js Prisma singleton.
 *
 * In dev, Next.js hot-reloads server modules on every change, which would
 * otherwise create a fresh PrismaClient (and a fresh pool of DB connections)
 * on every edit. Stashing the client on `globalThis` survives the reload.
 */
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}
