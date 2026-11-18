import { Prisma } from '../generated/prisma/client.js'

export function hasPrismaCode(
  error: unknown,
  code: 'P2002' | 'P2003' | 'P2025',
) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === code
  )
}
