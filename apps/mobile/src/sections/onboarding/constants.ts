import type { AllergenCode } from '@/api/types'
import {
  MAX_PROFILE_AGE,
  MIN_PROFILE_AGE,
  NAME_MAX_LENGTH,
} from '@/core/constants'

export const ALLERGY_ANSWER = {
  YES: 'yes',
  NO: 'no',
  UNKNOWN: 'unknown',
} as const

export const OTHER_ALLERGEN_CODE = 'OTHER'

export const ALLERGEN_LABELS: Record<AllergenCode, string> = {
  MILK: 'Milk',
  EGG: 'Eggs',
  FISH: 'Fish',
  CRUSTACEAN_SHELLFISH: 'Crustaceans',
  MOLLUSC: 'Molluscs',
  TREE_NUT: 'Tree nuts',
  PEANUT: 'Peanuts',
  WHEAT: 'Wheat',
  SOY: 'Soy',
  SESAME: 'Sesame',
  MUSTARD: 'Mustard',
  SULPHITES: 'Sulphites',
  OTHER: 'Other',
}

export const ONBOARDING_TEXT = {
  profileTitle: 'About you',
  profileSubtitle: 'Tell us who the meal plans are for.',
  nameLabel: 'Name',
  namePlaceholder: 'Your first name',
  dateOfBirthLabel: 'Date of birth',
  dateOfBirthPlaceholder: 'Select date',
  next: 'Continue',
  logOut: 'Log out',
  goalTitle: 'Daily calorie goal',
  goalSubtitle: 'This step is optional. You can set the goal later.',
  skip: 'Skip for now',
  allergyTitle: 'Food allergies',
  allergyQuestion: 'Do you have any food allergies?',
  answerYes: 'Yes',
  answerNo: 'No',
  answerUnknown: "I don't know",
  allergensLabel: 'Which allergies do you have?',
  otherLabel: 'Describe the allergy',
  otherPlaceholder: 'For example, kiwi',
  finish: 'Finish',
  back: 'Back',
} as const

export const ONBOARDING_ERRORS = {
  nameRequired: 'Enter a name.',
  nameTooLong: `Use at most ${NAME_MAX_LENGTH} characters.`,
  dateRequired: 'Select the date of birth.',
  dateOutOfRange: `The age must be between ${MIN_PROFILE_AGE} and ${MAX_PROFILE_AGE}.`,
  answerRequired: 'Choose an answer to continue.',
  allergenRequired: 'Select at least one allergy.',
  otherRequired: 'Describe the allergy.',
  otherTooLong: `Use at most ${NAME_MAX_LENGTH} characters.`,
} as const

export const ALLERGY_ANSWERS = [
  { value: ALLERGY_ANSWER.YES, label: ONBOARDING_TEXT.answerYes },
  { value: ALLERGY_ANSWER.NO, label: ONBOARDING_TEXT.answerNo },
  { value: ALLERGY_ANSWER.UNKNOWN, label: ONBOARDING_TEXT.answerUnknown },
] as const

export const WARNING_DIALOGS = {
  [ALLERGY_ANSWER.NO]: {
    title: 'Please double-check',
    message:
      'If you have an allergy and answer No, a plan may contain foods that are dangerous for you. Continue only if you are sure.',
  },
  [ALLERGY_ANSWER.UNKNOWN]: {
    title: 'Plans may not be safe for you',
    message:
      'If you do not know whether you have allergies, KitchenSaver cannot guarantee that a plan is free of any allergen. You use the plans at your own risk.',
  },
} as const

export const WARNING_DIALOG_BUTTONS = {
  confirm: 'I understand, continue',
  cancel: 'Go back',
} as const
