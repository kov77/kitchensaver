import { PrismaPg } from '@prisma/adapter-pg'

import { PrismaClient } from '../../src/generated/prisma/client.js'

export function createCleanerClient(connectionString: string) {
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) })
}

export async function truncateAllTables(prisma: PrismaClient) {
  const tables = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = current_schema() AND tablename <> '_prisma_migrations'`
  if (tables.length === 0) return
  const names = tables.map(({ tablename }) => `"${tablename}"`).join(', ')
  await prisma.$executeRawUnsafe(`TRUNCATE ${names} CASCADE`)
}
