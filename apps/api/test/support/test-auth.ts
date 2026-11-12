import { randomUUID } from 'node:crypto'

import {
  createLocalJWKSet,
  exportJWK,
  generateKeyPair,
  SignJWT,
  UnsecuredJWT,
} from 'jose'

import { JwtTokenVerifier } from '../../src/auth/token-verifier.js'

export const TEST_ISSUER = 'https://test.example/auth/v1'
export const TEST_AUDIENCE = 'authenticated'

const TEST_KEY_ID = 'test-key'

const { publicKey, privateKey } = await generateKeyPair('ES256')
const publicJwk = {
  ...(await exportJWK(publicKey)),
  kid: TEST_KEY_ID,
  alg: 'ES256',
  use: 'sig',
}

export const testJwks = { keys: [publicJwk] }

export function createTestTokenVerifier() {
  return new JwtTokenVerifier(
    createLocalJWKSet(testJwks),
    TEST_ISSUER,
    TEST_AUDIENCE,
  )
}

interface TokenOptions {
  subject?: string | null
  issuer?: string
  audience?: string | null
  expiresAtSeconds?: number | null
  algorithm?: string
  signingKey?: CryptoKey | Uint8Array
}

export async function signTestToken(options: TokenOptions = {}) {
  const {
    subject = `test-${randomUUID()}`,
    issuer = TEST_ISSUER,
    audience = TEST_AUDIENCE,
    expiresAtSeconds = Math.floor(Date.now() / 1000) + 3600,
    algorithm = 'ES256',
    signingKey = privateKey,
  } = options

  const jwt = new SignJWT({})
    .setProtectedHeader({ alg: algorithm, kid: TEST_KEY_ID })
    .setIssuer(issuer)
    .setIssuedAt()
  if (audience !== null) jwt.setAudience(audience)
  if (expiresAtSeconds !== null) jwt.setExpirationTime(expiresAtSeconds)
  if (subject !== null) jwt.setSubject(subject)
  return jwt.sign(signingKey)
}

export function createUnsignedTestToken(subject: string) {
  return new UnsecuredJWT({})
    .setIssuer(TEST_ISSUER)
    .setAudience(TEST_AUDIENCE)
    .setSubject(subject)
    .setExpirationTime('1h')
    .encode()
}

export async function createActor() {
  const subject = `test-${randomUUID()}`
  const token = await signTestToken({ subject })
  return { subject, authorization: `Bearer ${token}` }
}
