export const ME_QUERY_KEY = ['me'] as const
export const PEOPLE_QUERY_KEY = ['people'] as const
export const PEOPLE_LIST_QUERY_KEY = [...PEOPLE_QUERY_KEY, 'list'] as const
export const PERSON_QUERY_KEY = [...PEOPLE_QUERY_KEY, 'detail'] as const
export const BODY_PARAMETERS_NOT_FOUND_CODE = 'BODY_PARAMETERS_NOT_FOUND'
