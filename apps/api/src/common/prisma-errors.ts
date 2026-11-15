import { Prisma } from '../generated/prisma/client.js'

// P2002: unique constraint failed, P2025: the record to change was not found.
export function hasPrismaCode(error: unknown, code: 'P2002' | 'P2025') {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === code
  )
}
