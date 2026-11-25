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

import { AddPersonScreen } from './AddPersonScreen'

const mockBack = jest.fn()
const mockReplace = jest.fn()
const mockCanGoBack = jest.fn()
const mockSignOut = jest.fn()

type PostOptions = {
  params?: { header: Record<string, string> }
  body?: unknown
}

const ONBOARDING_PATH = '/api/v1/people/onboarding'
const mockPost = jest.fn<Promise<unknown>, [string, PostOptions]>()

jest.mock('@/api/apiClient', () => ({
  apiClient: {
    POST: (path: string, options: PostOptions) => mockPost(path, options),
  },
}))

jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: mockBack,
    replace: mockReplace,
    canGoBack: mockCanGoBack,
  }),
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

const NEW_PERSON: PersonListItem = {
  id: 'person-2',
  name: 'Alena',
  age: 36,
  goal: null,
  planReadiness: { ready: false, reasons: ['MISSING_GOAL'] },
  archivedAt: null,
}

function press(role: 'button' | 'radio', name: string) {
  return userEvent.setup().press(screen.getByRole(role, { name }))
}

async function fillProfile(name = 'Alena') {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText('Name'), name)
  await user.press(screen.getByRole('button', { name: /Date of birth/ }))
  fireEvent(
    screen.getByTestId('date-picker'),
    'onChange',
    { type: 'set' },
    new Date(1990, 4, 15),
  )
  await user.press(screen.getByRole('button', { name: 'Continue' }))
}

async function goToTheAllergyStep() {
  await fillProfile()
  await press('button', 'Skip for now')
  await screen.findByText('Do you have any food allergies?')
}

async function answerNoAndFinish() {
  await press('radio', 'No')
  await press('button', 'Finish')
  await press('button', 'I understand, continue')
}

beforeEach(() => {
  jest.clearAllMocks()
  mockCanGoBack.mockReturnValue(true)
  jest.mocked(randomUUID).mockReturnValue('key-1-0000000000000000')
})

describe('AddPersonScreen', () => {
  it('asks for a person, not for the account owner, and offers to cancel instead of logging out', async () => {
    await renderWithQuery(<AddPersonScreen />)

    expect(screen.getByRole('header', { name: 'Add a person' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Log out' })).toBeNull()
  })

  it('goes back when cancelled', async () => {
    await renderWithQuery(<AddPersonScreen />)

    await press('button', 'Cancel')

    expect(mockBack).toHaveBeenCalledTimes(1)
    expect(mockSignOut).not.toHaveBeenCalled()
  })

  it('opens the people list when there is no history to go back to', async () => {
    mockCanGoBack.mockReturnValue(false)
    await renderWithQuery(<AddPersonScreen />)

    await press('button', 'Cancel')

    expect(mockReplace).toHaveBeenCalledWith('/')
    expect(mockBack).not.toHaveBeenCalled()
  })

  it('creates the person with the same request as the first profile and goes back', async () => {
    mockPost.mockResolvedValue(apiResult(201, { person: NEW_PERSON }))
    await renderWithQuery(<AddPersonScreen />)
    await goToTheAllergyStep()

    await answerNoAndFinish()

    await waitFor(() => expect(mockBack).toHaveBeenCalledTimes(1))
    expect(mockPost).toHaveBeenCalledWith(ONBOARDING_PATH, {
      body: {
        name: 'Alena',
        dateOfBirth: '1990-05-15',
        allergies: { status: 'NONE', warningAcknowledged: true },
      },
      params: { header: { 'Idempotency-Key': 'key-1-0000000000000000' } },
    })
  })

  it('adds the new person to the cached list', async () => {
    mockPost.mockResolvedValue(apiResult(201, { person: NEW_PERSON }))
    const queryClient = createTestQueryClient()
    queryClient.setQueryData(getPeopleListKey('all'), [
      { ...NEW_PERSON, id: 'person-1', name: 'Max' },
    ])
    await renderWithQuery(<AddPersonScreen />, queryClient)
    await goToTheAllergyStep()

    await answerNoAndFinish()

    await waitFor(() => expect(mockBack).toHaveBeenCalledTimes(1))
    expect(
      queryClient
        .getQueryData<PersonListItem[]>(getPeopleListKey('all'))
        ?.map(({ name }) => name),
    ).toEqual(['Max', 'Alena'])
  })

  it('explains that the limit of profiles is reached and stays on the form', async () => {
    mockPost.mockResolvedValue(apiError(409, 'PROFILE_LIMIT_REACHED'))
    await renderWithQuery(<AddPersonScreen />)
    await goToTheAllergyStep()

    await answerNoAndFinish()

    expect(
      await screen.findByText(
        'You have reached the limit of profiles. Delete a profile to add another.',
      ),
    ).toBeTruthy()
    expect(mockBack).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Finish' })).toBeTruthy()
  })

  it('keeps the same request key for a retry after a failure', async () => {
    jest
      .mocked(randomUUID)
      .mockReturnValueOnce('key-1-0000000000000000')
      .mockReturnValueOnce('key-2-0000000000000000')
    mockPost
      .mockResolvedValueOnce(apiResult(503))
      .mockResolvedValueOnce(apiResult(201, { person: NEW_PERSON }))
    await renderWithQuery(<AddPersonScreen />)
    await goToTheAllergyStep()
    await answerNoAndFinish()
    await screen.findByText('The server had a problem. Please try again.')

    await press('button', 'Finish')
    await press('button', 'I understand, continue')

    const keys = mockPost.mock.calls.map(
      ([, options]) => options.params?.header['Idempotency-Key'],
    )
    expect(keys).toEqual(['key-1-0000000000000000', 'key-1-0000000000000000'])
  })

  it('still records the person when the screen is left before the answer arrives', async () => {
    let respond: (response: unknown) => void = () => undefined
    mockPost.mockReturnValue(new Promise((resolve) => (respond = resolve)))
    const queryClient = createTestQueryClient()
    queryClient.setQueryData(getPeopleListKey('all'), [])
    const screenUnderTest = await renderWithQuery(
      <AddPersonScreen />,
      queryClient,
    )
    await goToTheAllergyStep()
    await answerNoAndFinish()
    screenUnderTest.unmount()

    respond(apiResult(201, { person: NEW_PERSON }))

    await waitFor(() =>
      expect(
        queryClient.getQueryData<PersonListItem[]>(getPeopleListKey('all')),
      ).toEqual([NEW_PERSON]),
    )
    expect(mockBack).not.toHaveBeenCalled()
  })
})
