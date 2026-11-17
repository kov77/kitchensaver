import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

import { NestFactory } from '@nestjs/core'

import { configureApp } from '../app.setup.js'

const PLACEHOLDER_ENV = {
  NODE_ENV: 'production',
  DATABASE_URL: 'postgresql://openapi-export.invalid:5432/openapi_export',
  AUTH_JWKS_URL: 'https://openapi-export.invalid/jwks.json',
  AUTH_ISSUER: 'https://openapi-export.invalid',
  AUTH_AUDIENCE: 'authenticated',
}

const [outputArgument] = process.argv.slice(2)
if (!outputArgument) {
  throw new Error('Usage: export-openapi <output-file>')
}

Object.assign(process.env, PLACEHOLDER_ENV)

const { AppModule } = await import('../app.module.js')
const { createOpenApiDocument } = await import('./swagger.js')

const app = await NestFactory.create(AppModule, { logger: false })
configureApp(app, 'production')

const outputPath = resolve(outputArgument)
await mkdir(dirname(outputPath), { recursive: true })
await writeFile(
  outputPath,
  `${JSON.stringify(createOpenApiDocument(app), null, 2)}\n`,
)
await app.close()
