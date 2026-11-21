import {
  MAX_PROFILE_AGE,
  MIN_PROFILE_AGE,
  NAME_MAX_LENGTH,
} from '@/core/constants'

export const EMPTY_PROFILE: { name: string; dateOfBirth: Date | null } = {
  name: '',
  dateOfBirth: null,
}

export const PROFILE_TEXT = {
  nameLabel: 'Name',
  namePlaceholder: 'Your first name',
  dateOfBirthLabel: 'Date of birth',
  dateOfBirthPlaceholder: 'Select date',
} as const

export const PROFILE_ERRORS = {
  nameRequired: 'Enter a name.',
  nameTooLong: `Use at most ${NAME_MAX_LENGTH} characters.`,
  dateRequired: 'Select the date of birth.',
  dateOutOfRange: `The age must be between ${MIN_PROFILE_AGE} and ${MAX_PROFILE_AGE}.`,
} as const
