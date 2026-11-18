import type { components, paths } from './generated/schema'

type Schemas = components['schemas']

export type Me = Schemas['MeResponseDto']

export type OnboardingStatus = Schemas['OnboardingStatusDto']

export type RecordConsentsBody =
  paths['/api/v1/me/consents']['post']['requestBody']['content']['application/json']
