import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  fireEvent,
  render,
  screen,
  userEvent,
} from '@testing-library/react-native'
import { randomUUID } from 'expo-crypto'

import { PEOPLE_QUERY_KEY } from '@/api/constants'
import type { PersonListItem } from '@/api/types'
import { GOAL_EDITOR_TEXT } from '@/components/organisms/goal/constants'
import { ERROR_MESSAGES } from '@/core/constants'

import {
  ALLERGEN_LABELS,
  ONBOARDING_ERRORS,
  ONBOARDING_TEXT,
  WARNING_DIALOG_BUTTONS,
  WARNING_DIALOGS,
} from './constants'
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

function respond(status: number, data?: unknown) {
  return { data, response: new Response(null, { status }) } as never
}

async function renderOnboarding() {
  await render(
    <QueryClientProvider client={queryClient}>
      <OnboardingScreen />
    </QueryClientProvider>,
  )
}

async function fillProfile(name = 'Alex') {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText(ONBOARDING_TEXT.nameLabel), name)
  await user.press(
    screen.getByRole('button', {
      name: new RegExp(ONBOARDING_TEXT.dateOfBirthLabel),
    }),
  )
  fireEvent(
    screen.getByTestId('date-picker'),
    'onChange',
    { type: 'set' },
    new Date(1990, 4, 15),
  )
  await user.press(screen.getByRole('button', { name: ONBOARDING_TEXT.next }))
}

async function skipGoal() {
  await userEvent
    .setup()
    .press(await screen.findByRole('button', { name: ONBOARDING_TEXT.skip }))
}

function answer(label: string) {
  return userEvent.setup().press(screen.getByRole('radio', { name: label }))
}

function finish() {
  return userEvent
    .setup()
    .press(screen.getByRole('button', { name: ONBOARDING_TEXT.finish }))
}

beforeEach(() => {
  jest.clearAllMocks()
  keyCounter = 0
  jest
    .mocked(randomUUID)
    .mockImplementation(() => `key-${++keyCounter}-0000000000000000`)
  queryClient = new QueryClient()
})

describe('OnboardingScreen profile step', () => {
  it('asks for a name and a date before moving on', async () => {
    await renderOnboarding()

    await userEvent
      .setup()
      .press(screen.getByRole('button', { name: ONBOARDING_TEXT.next }))

    expect(await screen.findByText(ONBOARDING_ERRORS.nameRequired)).toBeTruthy()
    expect(screen.getByText(ONBOARDING_ERRORS.dateRequired)).toBeTruthy()
    expect(screen.queryByText(ONBOARDING_TEXT.allergyQuestion)).toBeNull()
  })

  it('moves to the optional goal step with valid answers', async () => {
    await renderOnboarding()

    await fillProfile()

    expect(await screen.findByText(ONBOARDING_TEXT.goalTitle)).toBeTruthy()
    expect(screen.queryByText(ONBOARDING_TEXT.allergyQuestion)).toBeNull()
  })

  it('lets the user log out', async () => {
    await renderOnboarding()

    await userEvent
      .setup()
      .press(screen.getByRole('button', { name: ONBOARDING_TEXT.logOut }))

    expect(mockSignOut).toHaveBeenCalledTimes(1)
  })
})

describe('OnboardingScreen goal step', () => {
  beforeEach(async () => {
    await renderOnboarding()
    await fillProfile()
    await screen.findByText(ONBOARDING_TEXT.goalTitle)
  })

  it('can be skipped, and then no goal is sent', async () => {
    mockPost.mockResolvedValue(respond(201, { person: PERSON }))
    await skipGoal()
    await answer(ONBOARDING_TEXT.answerUnknown)
    await finish()
    await userEvent.setup().press(
      await screen.findByRole('button', {
        name: WARNING_DIALOG_BUTTONS.confirm,
      }),
    )

    expect(onboardingBody()).not.toHaveProperty('goal')
  })

  it('sends a manual goal with the profile', async () => {
    mockPost.mockResolvedValue(respond(201, { person: PERSON }))
    const user = userEvent.setup()
    await user.press(
      screen.getByRole('radio', { name: GOAL_EDITOR_TEXT.modeManual }),
    )
    await user.press(screen.getByRole('radio', { name: 'Maintain weight' }))
    await user.type(screen.getByLabelText(GOAL_EDITOR_TEXT.kcalLabel), '2200')
    await user.press(screen.getByRole('button', { name: ONBOARDING_TEXT.next }))
    await answer(ONBOARDING_TEXT.answerUnknown)
    await finish()
    await user.press(
      await screen.findByRole('button', {
        name: WARNING_DIALOG_BUTTONS.confirm,
      }),
    )

    expect(onboardingBody()).toMatchObject({
      goal: { mode: 'MANUAL', goalType: 'MAINTAIN', dailyKcal: 2200 },
    })
  })

  it('previews the estimate without a profile, using the date of birth', async () => {
    mockPost.mockResolvedValue(
      respond(200, {
        estimatedMaintenanceKcal: 2275,
        methodology: 'DRI',
        assumptions: ['AGE_IN_COMPLETED_YEARS'],
      }),
    )
    const user = userEvent.setup()
    await user.press(
      screen.getByRole('radio', { name: GOAL_EDITOR_TEXT.modeEstimate }),
    )
    await user.press(screen.getByRole('radio', { name: 'Maintain weight' }))
    await user.type(screen.getByLabelText(GOAL_EDITOR_TEXT.heightLabel), '165')
    await user.type(screen.getByLabelText(GOAL_EDITOR_TEXT.weightLabel), '63')
    await user.press(screen.getByRole('radio', { name: 'Low active' }))
    await user.press(screen.getByRole('radio', { name: 'Female' }))
    await user.press(
      screen.getByRole('button', { name: GOAL_EDITOR_TEXT.calculate }),
    )

    await screen.findByText(GOAL_EDITOR_TEXT.disclaimer)
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
    await userEvent
      .setup()
      .press(screen.getByRole('button', { name: ONBOARDING_TEXT.back }))

    expect(
      (await screen.findByLabelText(ONBOARDING_TEXT.nameLabel)).props.value,
    ).toBe('Alex')
  })
})

describe('OnboardingScreen allergy step', () => {
  beforeEach(async () => {
    await renderOnboarding()
    await fillProfile()
    await skipGoal()
    await screen.findByText(ONBOARDING_TEXT.allergyQuestion)
  })

  it('does not save until the allergy question is answered', async () => {
    await finish()

    expect(
      await screen.findByText(ONBOARDING_ERRORS.answerRequired),
    ).toBeTruthy()
    expect(mockPost).not.toHaveBeenCalled()
  })

  it('needs at least one allergen when the answer is yes', async () => {
    await answer(ONBOARDING_TEXT.answerYes)

    await finish()

    expect(
      await screen.findByText(ONBOARDING_ERRORS.allergenRequired),
    ).toBeTruthy()
    expect(mockPost).not.toHaveBeenCalled()
  })

  it('needs a description when the allergen is other', async () => {
    const user = userEvent.setup()
    await answer(ONBOARDING_TEXT.answerYes)
    await user.press(
      screen.getByRole('checkbox', { name: ALLERGEN_LABELS.OTHER }),
    )

    await finish()

    expect(
      await screen.findByText(ONBOARDING_ERRORS.otherRequired),
    ).toBeTruthy()
    expect(mockPost).not.toHaveBeenCalled()
  })

  it('saves the listed allergens with an idempotency key', async () => {
    mockPost.mockResolvedValue(respond(201, { person: PERSON }))
    await answer(ONBOARDING_TEXT.answerYes)
    await userEvent
      .setup()
      .press(screen.getByRole('checkbox', { name: ALLERGEN_LABELS.PEANUT }))

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
    [ONBOARDING_TEXT.answerNo, 'NONE', WARNING_DIALOGS.no],
    [ONBOARDING_TEXT.answerUnknown, 'UNKNOWN', WARNING_DIALOGS.unknown],
  ] as const)(
    'warns before saving the answer %s and saves only after confirmation',
    async (label, status, dialog) => {
      mockPost.mockResolvedValue(respond(201, { person: PERSON }))
      await answer(label)

      await finish()

      expect(await screen.findByText(dialog.title)).toBeTruthy()
      expect(mockPost).not.toHaveBeenCalled()

      await userEvent
        .setup()
        .press(
          screen.getByRole('button', { name: WARNING_DIALOG_BUTTONS.confirm }),
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
    await answer(ONBOARDING_TEXT.answerNo)
    await finish()
    await screen.findByText(WARNING_DIALOGS.no.title)

    await userEvent
      .setup()
      .press(
        screen.getByRole('button', { name: WARNING_DIALOG_BUTTONS.cancel }),
      )

    expect(mockPost).not.toHaveBeenCalled()
  })

  it('adds the new person to the cached list so the app can open', async () => {
    mockPost.mockResolvedValue(respond(201, { person: PERSON }))
    await answer(ONBOARDING_TEXT.answerUnknown)
    await finish()
    await userEvent.setup().press(
      await screen.findByRole('button', {
        name: WARNING_DIALOG_BUTTONS.confirm,
      }),
    )

    await screen.findByRole('button', { name: ONBOARDING_TEXT.finish })
    expect(
      queryClient.getQueryData<PersonListItem[]>([...PEOPLE_QUERY_KEY, 'all']),
    ).toEqual([PERSON])
  })

  it('keeps the same key when the same data is sent again after a failure', async () => {
    mockPost.mockResolvedValue(respond(500))
    await answer(ONBOARDING_TEXT.answerYes)
    await userEvent
      .setup()
      .press(screen.getByRole('checkbox', { name: ALLERGEN_LABELS.MILK }))

    await finish()
    await screen.findByText(ERROR_MESSAGES.SERVER)
    await finish()

    const keys = idempotencyKeys()
    expect(keys).toEqual(['key-1-0000000000000000', 'key-1-0000000000000000'])
  })

  it('uses a new key when the data changed after a failure', async () => {
    mockPost.mockResolvedValue(respond(500))
    const user = userEvent.setup()
    await answer(ONBOARDING_TEXT.answerYes)
    await user.press(
      screen.getByRole('checkbox', { name: ALLERGEN_LABELS.MILK }),
    )
    await finish()
    await screen.findByText(ERROR_MESSAGES.SERVER)

    await user.press(
      screen.getByRole('checkbox', { name: ALLERGEN_LABELS.EGG }),
    )
    await finish()

    const keys = idempotencyKeys()
    expect(keys).toEqual(['key-1-0000000000000000', 'key-2-0000000000000000'])
  })

  it('shows a plain message and keeps the answers when the server refuses', async () => {
    mockPost.mockResolvedValue(respond(409))
    await answer(ONBOARDING_TEXT.answerYes)
    await userEvent
      .setup()
      .press(screen.getByRole('checkbox', { name: ALLERGEN_LABELS.MILK }))

    await finish()

    expect(await screen.findByText(ERROR_MESSAGES.CONFLICT)).toBeTruthy()
    expect(
      screen.getByRole('checkbox', { name: ALLERGEN_LABELS.MILK }),
    ).toBeChecked()
  })

  it('marks the cached profile list stale after a failure so a saved profile is found', async () => {
    const peopleKey = [...PEOPLE_QUERY_KEY, 'all']
    queryClient.setQueryData(peopleKey, [])
    mockPost.mockResolvedValue(respond(409))
    await answer(ONBOARDING_TEXT.answerUnknown)
    await finish()
    await userEvent.setup().press(
      await screen.findByRole('button', {
        name: WARNING_DIALOG_BUTTONS.confirm,
      }),
    )

    await screen.findByText(ERROR_MESSAGES.CONFLICT)

    expect(queryClient.getQueryState(peopleKey)?.isInvalidated).toBe(true)
  })

  it('goes back to the goal step', async () => {
    await userEvent
      .setup()
      .press(screen.getByRole('button', { name: ONBOARDING_TEXT.back }))

    expect(await screen.findByText(ONBOARDING_TEXT.goalTitle)).toBeTruthy()
  })
})
