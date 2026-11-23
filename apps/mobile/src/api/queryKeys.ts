import { PEOPLE_LIST_QUERY_KEY, PERSON_QUERY_KEY } from './constants'
import type { PeopleStatus } from './types'

export function getPeopleListKey(status: PeopleStatus) {
  return [...PEOPLE_LIST_QUERY_KEY, status] as const
}

export function getPersonKey(personId: string) {
  return [...PERSON_QUERY_KEY, personId] as const
}

export function getAllergiesKey(personId: string) {
  return [...getPersonKey(personId), 'allergies'] as const
}

export function getExclusionsKey(personId: string) {
  return [...getPersonKey(personId), 'exclusions'] as const
}

export function getPreferencesKey(personId: string) {
  return [...getPersonKey(personId), 'preferences'] as const
}
