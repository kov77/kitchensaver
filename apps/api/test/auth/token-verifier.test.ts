import { createServer } from 'node:http'

import { generateKeyPair } from 'jose'
import { describe, expect, it, onTestFinished } from 'vitest'

import {
  createRemoteTokenVerifier,
  InvalidTokenError,
  TokenVerificationUnavailableError,
} from '../../src/auth/token-verifier.js'
import {
  createTestTokenVerifier,
  createUnsignedTestToken,
  signTestToken,
  TEST_AUDIENCE,
  TEST_ISSUER,
  testJwks,
} from '../support/test-auth.js'

const verifier = createTestTokenVerifier()
const nowSeconds = () => Math.floor(Date.now() / 1000)

describe('JwtTokenVerifier', () => {
  it('returns the subject of a valid token', async () => {
    const token = await signTestToken({ subject: 'subject-1' })

    await expect(verifier.verify(token)).resolves.toEqual({
      subject: 'subject-1',
    })
  })

  it.each([
    [
      'expired',
      () => signTestToken({ expiresAtSeconds: nowSeconds() - 60 }),
      'ERR_JWT_EXPIRED',
    ],
    [
      'without an expiry',
      () => signTestToken({ expiresAtSeconds: null }),
      'ERR_JWT_CLAIM_VALIDATION_FAILED',
    ],
    [
      'from another issuer',
      () => signTestToken({ issuer: 'https://evil.example/auth/v1' }),
      'ERR_JWT_CLAIM_VALIDATION_FAILED',
    ],
    [
      'for another audience',
      () => signTestToken({ audience: `not-${TEST_AUDIENCE}` }),
      'ERR_JWT_CLAIM_VALIDATION_FAILED',
    ],
    [
      'without an audience',
      () => signTestToken({ audience: null }),
      'ERR_JWT_CLAIM_VALIDATION_FAILED',
    ],
    [
      'without a subject',
      () => signTestToken({ subject: null }),
      'ERR_JWT_CLAIM_VALIDATION_FAILED',
    ],
    [
      'with an empty subject',
      () => signTestToken({ subject: '' }),
      'missing_subject',
    ],
    [
      'signed with an unknown key',
      async () =>
        signTestToken({
          signingKey: (await generateKeyPair('ES256')).privateKey,
        }),
      'ERR_JWS_SIGNATURE_VERIFICATION_FAILED',
    ],
    [
      'signed with HS256',
      () =>
        signTestToken({
          algorithm: 'HS256',
          signingKey: new TextEncoder().encode(
            'a-shared-secret-of-32-bytes-or-more',
          ),
        }),
      'ERR_JOSE_ALG_NOT_ALLOWED',
    ],
    [
      'signed with RS256',
      async () =>
        signTestToken({
          algorithm: 'RS256',
          signingKey: (await generateKeyPair('RS256')).privateKey,
        }),
      'ERR_JOSE_ALG_NOT_ALLOWED',
    ],
    [
      'unsigned (alg none)',
      async () => createUnsignedTestToken('subject-1'),
      'ERR_JOSE_ALG_NOT_ALLOWED',
    ],
    ['malformed', async () => 'not-a-jwt', 'ERR_JWS_INVALID'],
  ])('rejects a token that is %s', async (_name, makeToken, reason) => {
    const token = await makeToken()

    const rejection = verifier.verify(token)

    await expect(rejection).rejects.toBeInstanceOf(InvalidTokenError)
    await expect(rejection).rejects.toMatchObject({ reason })
  })

  it('does not put the token in the error', async () => {
    const token = await signTestToken({ expiresAtSeconds: nowSeconds() - 60 })

    const error = await verifier.verify(token).catch((caught) => caught)

    expect(error).toBeInstanceOf(InvalidTokenError)
    expect(`${error.message} ${error.reason}`).not.toContain(token)
  })
})

async function serveJwks(body: unknown) {
  const server = createServer((_request, response) => {
    response.setHeader('Content-Type', 'application/json')
    response.end(JSON.stringify(body))
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  onTestFinished(
    () =>
      new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      ),
  )
  const address = server.address()
  if (!address || typeof address === 'string') {
    throw new Error('JWKS test server has no TCP address')
  }
  return `http://127.0.0.1:${address.port}/jwks`
}

describe('createRemoteTokenVerifier', () => {
  it('verifies tokens against the keys served at the JWKS url', async () => {
    const jwksUrl = await serveJwks(testJwks)
    const remote = createRemoteTokenVerifier({
      jwksUrl,
      issuer: TEST_ISSUER,
      audience: TEST_AUDIENCE,
    })
    const token = await signTestToken({ subject: 'subject-1' })

    await expect(remote.verify(token)).resolves.toEqual({
      subject: 'subject-1',
    })
  })

  it('applies the configured issuer and audience', async () => {
    const jwksUrl = await serveJwks(testJwks)
    const wrongIssuer = createRemoteTokenVerifier({
      jwksUrl,
      issuer: 'https://other.example/auth/v1',
      audience: TEST_AUDIENCE,
    })
    const wrongAudience = createRemoteTokenVerifier({
      jwksUrl,
      issuer: TEST_ISSUER,
      audience: 'someone-else',
    })
    const token = await signTestToken()

    await expect(wrongIssuer.verify(token)).rejects.toBeInstanceOf(
      InvalidTokenError,
    )
    await expect(wrongAudience.verify(token)).rejects.toBeInstanceOf(
      InvalidTokenError,
    )
  })

  it('reports an unreachable JWKS as unavailable, not as a bad token', async () => {
    const unreachable = createRemoteTokenVerifier({
      jwksUrl: 'http://127.0.0.1:1/jwks',
      issuer: TEST_ISSUER,
      audience: TEST_AUDIENCE,
    })
    const token = await signTestToken()

    await expect(unreachable.verify(token)).rejects.toBeInstanceOf(
      TokenVerificationUnavailableError,
    )
  })

  it('reports a broken JWKS response as unavailable', async () => {
    const jwksUrl = await serveJwks({ unexpected: true })
    const remote = createRemoteTokenVerifier({
      jwksUrl,
      issuer: TEST_ISSUER,
      audience: TEST_AUDIENCE,
    })
    const token = await signTestToken()

    await expect(remote.verify(token)).rejects.toBeInstanceOf(
      TokenVerificationUnavailableError,
    )
  })
})
