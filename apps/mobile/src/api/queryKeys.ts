import { PEOPLE_QUERY_KEY } from './constants'
import type { PeopleStatus } from './types'

export function getPeopleListKey(status: PeopleStatus) {
  return [...PEOPLE_QUERY_KEY, status] as const
}
