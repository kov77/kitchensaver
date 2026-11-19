import type { components, paths } from './generated/schema'

type Schemas = components['schemas']

export type Me = Schemas['MeResponseDto']

export type OnboardingStatus = Schemas['OnboardingStatusDto']

export type RecordConsentsBody =
  paths['/api/v1/me/consents']['post']['requestBody']['content']['application/json']

export type PersonListItem = Schemas['PersonListItemDto']

export type OnboardingBody =
  paths['/api/v1/people/onboarding']['post']['requestBody']['content']['application/json']

export type OnboardingAllergies = OnboardingBody['allergies']

export type AllergenCode = Extract<
  OnboardingAllergies,
  { status: 'HAS_ALLERGIES' }
>['items'][number]['allergenCode']
