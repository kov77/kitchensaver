import type { components, paths } from './generated/schema'

type Schemas = components['schemas']

export type Me = Schemas['MeResponseDto']

export type OnboardingStatus = Schemas['OnboardingStatusDto']

export type RecordConsentsBody =
  paths['/api/v1/me/consents']['post']['requestBody']['content']['application/json']

export type PeopleStatus = NonNullable<
  NonNullable<paths['/api/v1/people']['get']['parameters']['query']>['status']
>

export type PersonListItem = Schemas['PersonListItemDto']

export type PersonGoal = NonNullable<PersonListItem['goal']>

export type PlanReadinessReason =
  PersonListItem['planReadiness']['reasons'][number]

export type OnboardingBody =
  paths['/api/v1/people/onboarding']['post']['requestBody']['content']['application/json']

export type PersonDetail = Schemas['PersonDetailDto']

export type Allergy = Schemas['AllergyDto']

export type Exclusion = Schemas['ExclusionDto']

export type Preference = Schemas['PreferenceDto']

export type StoredBodyParameters = Schemas['BodyParametersDto']
