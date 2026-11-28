import { QueryClient } from '@tanstack/react-query'
import {
  fireEvent,
  screen,
  userEvent,
  waitFor,
} from '@testing-library/react-native'
import { randomUUID } from 'expo-crypto'

import { getPeopleListKey } from '@/api/queryKeys'
import type { PersonListItem } from '@/api/types'
import { apiError } from '@/test-utils/apiError'
import { apiResult } from '@/test-utils/apiResult'
import {
  createTestQueryClient,
  renderWithQuery,
} from '@/test-utils/renderWithQuery'

import { OnboardingScreen } from './OnboardingScreen'

const mockSignOut = jest.fn()
type PostOptions = {
  params?: { header: Record<string, string> }
  body?: unknown
}

const ONBOARDING_PATH = '/api/v1/people/onboarding'
const PREVIEW_PATH = '/api/v1/people/goals/estimate'

const mockPost = jest.fn<Promise<unknown>, [string, PostOptions]>()

jest.mock('@/api/apiClient', () => ({
  apiClient: {
    POST: (path: string, options: PostOptions) => mockPost(path, options),
  },
}))

jest.mock('@/core/auth/SessionProvider', () => ({
  useSession: () => ({ signOut: mockSignOut }),
}))

jest.mock('expo-crypto', () => ({ randomUUID: jest.fn() }))

jest.mock('@react-native-community/datetimepicker', () => {
  const { View: MockView } = jest.requireActual('react-native')
  return {
    __esModule: true,
    default: (props: object) => <MockView testID="date-picker" {...props} />,
  }
})

const PERSON = { id: 'person-1', name: 'Alex' }

let queryClient: QueryClient
let keyCounter: number

function idempotencyKeys() {
  return mockPost.mock.calls
    .filter(([path]) => path === ONBOARDING_PATH)
    .map(([, options]) => options.params?.header['Idempotency-Key'])
}

function onboardingBody() {
  return mockPost.mock.calls.find(([path]) => path === ONBOARDING_PATH)?.[1]
    .body
}

async function renderOnboarding() {
  await renderWithQuery(<OnboardingScreen />, queryClient)
}

async function fillProfile(name = 'Alex') {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText('Name'), name)
  await user.press(
    screen.getByRole('button', {
      name: new RegExp('Date of birth'),
    }),
  )
  fireEvent(
    screen.getByTestId('date-picker'),
    'onChange',
    { type: 'set' },
    new Date(1990, 4, 15),
  )
  await user.press(screen.getByRole('button', { name: 'Continue' }))
}

async function skipGoal() {
  await userEvent
    .setup()
    .press(await screen.findByRole('button', { name: 'Skip for now' }))
}

function answer(label: string) {
  return userEvent.setup().press(screen.getByRole('radio', { name: label }))
}

function finish() {
  return userEvent.setup().press(screen.getByRole('button', { name: 'Finish' }))
}

beforeEach(() => {
  jest.clearAllMocks()
  keyCounter = 0
  jest
    .mocked(randomUUID)
    .mockImplementation(() => `key-${++keyCounter}-0000000000000000`)
  queryClient = createTestQueryClient()
})

describe('OnboardingScreen profile step', () => {
  it('asks for a name and a date before moving on', async () => {
    await renderOnboarding()

    await userEvent
      .setup()
      .press(screen.getByRole('button', { name: 'Continue' }))

    expect(await screen.findAllByText('This field is required.')).toHaveLength(
      2,
    )
    expect(screen.queryByText('Do you have any food allergies?')).toBeNull()
  })

  it('moves to the optional goal step with valid answers', async () => {
    await renderOnboarding()

    await fillProfile()

    expect(await screen.findByText('Daily calorie goal')).toBeTruthy()
    expect(screen.queryByText('Do you have any food allergies?')).toBeNull()
  })

  it('lets the user log out', async () => {
    await renderOnboarding()

    await userEvent
      .setup()
      .press(screen.getByRole('button', { name: 'Log out' }))

    expect(mockSignOut).toHaveBeenCalledTimes(1)
  })
})

describe('OnboardingScreen goal step', () => {
  beforeEach(async () => {
    await renderOnboarding()
    await fillProfile()
    await screen.findByText('Daily calorie goal')
  })

  it('can be skipped, and then no goal is sent', async () => {
    mockPost.mockResolvedValue(apiResult(201, { person: PERSON }))
    await skipGoal()
    await answer("I don't know")
    await finish()
    await userEvent.setup().press(
      await screen.findByRole('button', {
        name: 'I understand, continue',
      }),
    )

    expect(onboardingBody()).not.toHaveProperty('goal')
  })

  it('sends a manual goal with the profile', async () => {
    mockPost.mockResolvedValue(apiResult(201, { person: PERSON }))
    const user = userEvent.setup()
    await user.press(
      screen.getByRole('radio', { name: 'I already know my daily calories' }),
    )
    await user.press(screen.getByRole('radio', { name: 'Maintain weight' }))
    await user.type(screen.getByLabelText('Daily calories (kcal)'), '2200')
    await user.press(screen.getByRole('button', { name: 'Continue' }))
    await answer("I don't know")
    await finish()
    await user.press(
      await screen.findByRole('button', {
        name: 'I understand, continue',
      }),
    )

    expect(onboardingBody()).toMatchObject({
      goal: { mode: 'MANUAL', goalType: 'MAINTAIN', dailyKcal: 2200 },
    })
  })

  it('asks for confirmation of calories outside the usual range and sends the goal again with it', async () => {
    mockPost
      .mockResolvedValueOnce(apiError(422, 'GOAL_KCAL_OUT_OF_RANGE'))
      .mockResolvedValueOnce(apiResult(201, { person: PERSON }))
    const user = userEvent.setup()
    await user.press(
      screen.getByRole('radio', { name: 'I already know my daily calories' }),
    )
    await user.press(screen.getByRole('radio', { name: 'Maintain weight' }))
    await user.type(screen.getByLabelText('Daily calories (kcal)'), '1100')
    await user.press(screen.getByRole('button', { name: 'Continue' }))
    await answer("I don't know")
    await finish()
    await user.press(
      await screen.findByRole('button', { name: 'I understand, continue' }),
    )

    await screen.findByText('Outside the usual range')
    await user.press(screen.getByRole('button', { name: 'Save anyway' }))

    await waitFor(() => expect(idempotencyKeys()).toHaveLength(2))
    expect(
      mockPost.mock.calls.filter(([path]) => path === ONBOARDING_PATH)[1]?.[1]
        .body,
    ).toMatchObject({
      goal: { dailyKcal: 1100, confirmKcalWarning: true },
    })
    expect(new Set(idempotencyKeys()).size).toBe(2)
  })

  it('previews the estimate without a profile, using the date of birth', async () => {
    mockPost.mockResolvedValue(
      apiResult(200, {
        estimatedMaintenanceKcal: 2275,
        methodology: 'DRI',
        assumptions: ['AGE_IN_COMPLETED_YEARS'],
        kcalSuggestions: [],
      }),
    )
    const user = userEvent.setup()
    await user.press(screen.getByRole('radio', { name: 'Help me estimate' }))
    await user.press(screen.getByRole('radio', { name: 'Maintain weight' }))
    await user.type(screen.getByLabelText('Height (cm)'), '165')
    await user.type(screen.getByLabelText('Weight (kg)'), '63')
    await user.press(screen.getByRole('radio', { name: 'Low active' }))
    await user.press(screen.getByRole('radio', { name: 'Female' }))
    await user.press(screen.getByRole('button', { name: 'Calculate estimate' }))

    await screen.findByText(
      'This is an estimate for information only. It is not medical advice.',
    )
    expect(mockPost).toHaveBeenCalledWith(PREVIEW_PATH, {
      body: {
        dateOfBirth: '1990-05-15',
        goalType: 'MAINTAIN',
        heightCm: 165,
        weightKg: 63,
        activityLevel: 'LOW_ACTIVE',
        formulaSex: 'FEMALE',
      },
    })
  })

  it('goes back to the profile with the values kept', async () => {
    await userEvent.setup().press(screen.getByRole('button', { name: 'Back' }))

    expect((await screen.findByLabelText('Name')).props.value).toBe('Alex')
  })
})

describe('OnboardingScreen allergy step', () => {
  beforeEach(async () => {
    await renderOnboarding()
    await fillProfile()
    await skipGoal()
    await screen.findByText('Do you have any food allergies?')
  })

  it('does not save until the allergy question is answered', async () => {
    await finish()

    expect(await screen.findByText('This field is required.')).toBeTruthy()
    expect(mockPost).not.toHaveBeenCalled()
  })

  it('needs at least one allergen when the answer is yes', async () => {
    await answer('Yes')

    await finish()

    expect(await screen.findByText('This field is required.')).toBeTruthy()
    expect(mockPost).not.toHaveBeenCalled()
  })

  it('needs a description when the allergen is other', async () => {
    const user = userEvent.setup()
    await answer('Yes')
    await user.press(screen.getByRole('checkbox', { name: 'Other' }))

    await finish()

    expect(await screen.findByText('This field is required.')).toBeTruthy()
    expect(mockPost).not.toHaveBeenCalled()
  })

  it('saves the listed allergens with an idempotency key', async () => {
    mockPost.mockResolvedValue(apiResult(201, { person: PERSON }))
    await answer('Yes')
    await userEvent
      .setup()
      .press(screen.getByRole('checkbox', { name: 'Peanuts' }))

    await finish()

    expect(mockPost).toHaveBeenCalledWith('/api/v1/people/onboarding', {
      body: {
        name: 'Alex',
        dateOfBirth: '1990-05-15',
        allergies: {
          status: 'HAS_ALLERGIES',
          items: [{ allergenCode: 'PEANUT' }],
        },
      },
      params: { header: { 'Idempotency-Key': 'key-1-0000000000000000' } },
    })
  })

  it.each([
    ['No', 'NONE', 'Please double-check'],
    ["I don't know", 'UNKNOWN', 'Plans may not be safe for you'],
  ] as const)(
    'warns before saving the answer %s and saves only after confirmation',
    async (label, status, dialogTitle) => {
      mockPost.mockResolvedValue(apiResult(201, { person: PERSON }))
      await answer(label)

      await finish()

      expect(await screen.findByText(dialogTitle)).toBeTruthy()
      expect(mockPost).not.toHaveBeenCalled()

      await userEvent.setup().press(
        screen.getByRole('button', {
          name: 'I understand, continue',
        }),
      )

      expect(mockPost).toHaveBeenCalledWith(
        '/api/v1/people/onboarding',
        expect.objectContaining({
          body: expect.objectContaining({
            allergies: { status, warningAcknowledged: true },
          }),
        }),
      )
    },
  )

  it('saves nothing when the user goes back from the warning', async () => {
    await answer('No')
    await finish()
    await screen.findByText('Please double-check')

    await userEvent.setup().press(
      screen.getByRole('button', {
        name: 'Go back',
      }),
    )

    expect(mockPost).not.toHaveBeenCalled()
  })

  it('adds the new person to the cached list so the app can open', async () => {
    mockPost.mockResolvedValue(apiResult(201, { person: PERSON }))
    await answer("I don't know")
    await finish()
    await userEvent.setup().press(
      await screen.findByRole('button', {
        name: 'I understand, continue',
      }),
    )

    await screen.findByRole('button', { name: 'Finish' })
    expect(
      queryClient.getQueryData<PersonListItem[]>(getPeopleListKey('all')),
    ).toEqual([PERSON])
  })

  it('keeps the same key when the same data is sent again after a failure', async () => {
    mockPost.mockResolvedValue(apiResult(500))
    await answer('Yes')
    await userEvent
      .setup()
      .press(screen.getByRole('checkbox', { name: 'Milk' }))

    await finish()
    await screen.findByText('The server had a problem. Please try again.')
    await finish()

    const keys = idempotencyKeys()
    expect(keys).toEqual(['key-1-0000000000000000', 'key-1-0000000000000000'])
  })

  it('uses a new key when the data changed after a failure', async () => {
    mockPost.mockResolvedValue(apiResult(500))
    const user = userEvent.setup()
    await answer('Yes')
    await user.press(screen.getByRole('checkbox', { name: 'Milk' }))
    await finish()
    await screen.findByText('The server had a problem. Please try again.')

    await user.press(screen.getByRole('checkbox', { name: 'Eggs' }))
    await finish()

    const keys = idempotencyKeys()
    expect(keys).toEqual(['key-1-0000000000000000', 'key-2-0000000000000000'])
  })

  it('shows a plain message and keeps the answers when the server refuses', async () => {
    mockPost.mockResolvedValue(apiResult(409))
    await answer('Yes')
    await userEvent
      .setup()
      .press(screen.getByRole('checkbox', { name: 'Milk' }))

    await finish()

    expect(
      await screen.findByText(
        'This could not be saved right now. Please try again.',
      ),
    ).toBeTruthy()
    expect(screen.getByRole('checkbox', { name: 'Milk' })).toBeChecked()
  })

  it('marks the cached profile list stale after a failure so a saved profile is found', async () => {
    const peopleKey = getPeopleListKey('all')
    queryClient.setQueryData(peopleKey, [])
    mockPost.mockResolvedValue(apiResult(409))
    await answer("I don't know")
    await finish()
    await userEvent.setup().press(
      await screen.findByRole('button', {
        name: 'I understand, continue',
      }),
    )

    await screen.findByText(
      'This could not be saved right now. Please try again.',
    )

    expect(queryClient.getQueryState(peopleKey)?.isInvalidated).toBe(true)
  })

  it('goes back to the goal step', async () => {
    await userEvent.setup().press(screen.getByRole('button', { name: 'Back' }))

    expect(await screen.findByText('Daily calorie goal')).toBeTruthy()
  })
})
