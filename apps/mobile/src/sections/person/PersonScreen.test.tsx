import { screen, userEvent, waitFor } from '@testing-library/react-native'

import { apiClient } from '@/api/apiClient'
import {
  getBodyParametersKey,
  getExclusionsKey,
  getPeopleListKey,
  getPersonKey,
  getPreferencesKey,
} from '@/api/queryKeys'
import type { Allergy, PersonDetail } from '@/api/types'
import { apiError } from '@/test-utils/apiError'
import { apiResult } from '@/test-utils/apiResult'
import {
  createTestQueryClient,
  renderWithQuery,
} from '@/test-utils/renderWithQuery'

import { PersonScreen } from './PersonScreen'

const mockBack = jest.fn()
const mockPush = jest.fn()
const mockReplace = jest.fn()
const mockCanGoBack = jest.fn()

jest.mock('@/api/apiClient', () => ({
  apiClient: { GET: jest.fn(), PATCH: jest.fn(), DELETE: jest.fn() },
}))

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ personId: 'person-1' }),
  useRouter: () => ({
    back: mockBack,
    push: mockPush,
    replace: mockReplace,
    canGoBack: mockCanGoBack,
  }),
}))

type ApiResult = ReturnType<typeof apiResult>

const PERSON: PersonDetail = {
  id: 'person-1',
  name: 'Max',
  age: 34,
  dateOfBirth: '1992-03-04',
  goal: { mode: 'MANUAL', goalType: 'LOSE', dailyKcal: 2100 },
  planReadiness: { ready: true, reasons: [] },
  archivedAt: null,
  allergyStatus: 'NONE',
  allergyStatusAt: '2026-11-01T10:00:00.000Z',
  capabilities: { goalEstimation: true },
  createdAt: '2026-11-01T10:00:00.000Z',
}

const PEANUT_ALLERGY: Allergy = {
  id: 'allergy-1',
  allergenCode: 'PEANUT',
  customLabel: null,
  resolved: true,
  createdAt: '2026-11-01T10:00:00.000Z',
}

const KIWI_ALLERGY: Allergy = {
  id: 'allergy-2',
  allergenCode: 'OTHER',
  customLabel: 'Kiwi',
  resolved: false,
  createdAt: '2026-11-01T10:00:00.000Z',
}

const requestedPaths: string[] = []

const LIST_PATHS: Record<
  string,
  'allergies' | 'exclusions' | 'preferences' | 'bodyParameters'
> = {
  '/api/v1/people/{id}/allergies': 'allergies',
  '/api/v1/people/{id}/exclusions': 'exclusions',
  '/api/v1/people/{id}/preferences': 'preferences',
  '/api/v1/people/{id}/body-parameters': 'bodyParameters',
}

function respondWith({
  person = apiResult(200, PERSON),
  allergies = apiResult(200, []),
  exclusions = apiResult(200, []),
  preferences = apiResult(200, []),
  bodyParameters = apiError(404, 'BODY_PARAMETERS_NOT_FOUND'),
}: {
  person?: ApiResult
  allergies?: ApiResult
  exclusions?: ApiResult
  preferences?: ApiResult
  bodyParameters?: ApiResult
} = {}) {
  const lists = { allergies, exclusions, preferences, bodyParameters }
  jest.mocked(apiClient.GET).mockImplementation(async (path: string) => {
    requestedPaths.push(path)
    const list = LIST_PATHS[path]
    return list ? lists[list] : person
  })
}

async function renderPerson() {
  await renderWithQuery(<PersonScreen />)
}

beforeEach(() => {
  jest.clearAllMocks()
  requestedPaths.length = 0
  mockCanGoBack.mockReturnValue(true)
  respondWith()
})

describe('PersonScreen', () => {
  it('shows the name, age, birth date and goal of the person', async () => {
    await renderPerson()

    expect(await screen.findByRole('header', { name: 'Max' })).toBeTruthy()
    expect(screen.getByText(`34 years old`)).toBeTruthy()
    expect(screen.getByText('4 March 1992')).toBeTruthy()
    expect(screen.getByText('Lose weight · 2,100 kcal/day')).toBeTruthy()
  })

  it('asks the server for the person in the route', async () => {
    await renderPerson()
    await screen.findByRole('header', { name: 'Max' })

    expect(apiClient.GET).toHaveBeenCalledWith('/api/v1/people/{id}', {
      params: { path: { id: 'person-1' } },
    })
  })

  it('shows the excluded foods and the food ratings of the person', async () => {
    respondWith({
      exclusions: apiResult(200, [
        { id: 'exclusion-1', ingredientName: 'Mushrooms', createdAt: 'now' },
      ]),
      preferences: apiResult(200, [
        {
          id: 'preference-1',
          ingredientName: 'Kiwi',
          rating: 4,
          updatedAt: 'now',
        },
      ]),
    })
    await renderPerson()

    expect(await screen.findByText('Mushrooms')).toBeTruthy()
    expect(await screen.findByText('Kiwi')).toBeTruthy()
    expect(requestedPaths).toEqual(
      expect.arrayContaining([
        '/api/v1/people/{id}/exclusions',
        '/api/v1/people/{id}/preferences',
      ]),
    )
  })

  it('tells what is missing before the person can be planned for', async () => {
    respondWith({
      person: apiResult(200, {
        ...PERSON,
        goal: null,
        planReadiness: { ready: false, reasons: ['MISSING_GOAL'] },
      }),
    })
    await renderPerson()

    expect(
      await screen.findByText(`Not ready to plan: add a daily calorie goal`),
    ).toBeTruthy()
    expect(screen.getByText('No goal yet')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Set goal' })).toBeTruthy()
  })

  it('opens the goal screen for this person', async () => {
    await renderPerson()

    await userEvent
      .setup()
      .press(await screen.findByRole('button', { name: 'Change goal' }))

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/goal/[personId]',
      params: { personId: 'person-1' },
    })
  })

  it('goes back', async () => {
    await renderPerson()
    await screen.findByRole('header', { name: 'Max' })

    await userEvent.setup().press(screen.getByRole('button', { name: 'Back' }))

    expect(mockBack).toHaveBeenCalledTimes(1)
  })

  it('opens the people list when there is nowhere to go back to', async () => {
    mockCanGoBack.mockReturnValue(false)
    await renderPerson()
    await screen.findByRole('header', { name: 'Max' })

    await userEvent.setup().press(screen.getByRole('button', { name: 'Back' }))

    expect(mockReplace).toHaveBeenCalledWith('/')
    expect(mockBack).not.toHaveBeenCalled()
  })

  it('shows a message and retries when the person cannot be loaded', async () => {
    respondWith({ person: apiResult(500) })
    await renderPerson()

    expect(
      await screen.findByText('The server had a problem. Please try again.'),
    ).toBeTruthy()

    respondWith()
    await userEvent
      .setup()
      .press(screen.getByRole('button', { name: 'Try again' }))

    expect(await screen.findByRole('header', { name: 'Max' })).toBeTruthy()
  })
})

describe('PersonScreen allergies', () => {
  it.each([
    ['NONE', 'No known allergies.'],
    [
      'UNKNOWN',
      'Not known. Plans cannot guarantee that they are free of any allergen.',
    ],
    [null, 'Not answered yet.'],
  ] as const)('explains the allergy status %s', async (status, text) => {
    respondWith({
      person: apiResult(200, { ...PERSON, allergyStatus: status }),
    })
    await renderPerson()

    expect(await screen.findByText(text)).toBeTruthy()
    expect(apiClient.GET).not.toHaveBeenCalledWith(
      '/api/v1/people/{id}/allergies',
      expect.anything(),
    )
  })

  it('lists the allergies with the custom label for other allergens', async () => {
    respondWith({
      person: apiResult(200, {
        ...PERSON,
        allergyStatus: 'HAS_ALLERGIES',
      }),
      allergies: apiResult(200, [PEANUT_ALLERGY, KIWI_ALLERGY]),
    })
    await renderPerson()

    expect(await screen.findByText('Peanuts')).toBeTruthy()
    expect(screen.getByText('Kiwi')).toBeTruthy()
    expect(screen.queryByText('Other')).toBeNull()
  })

  it('does not show an empty list when the server says there are allergies', async () => {
    respondWith({
      person: apiResult(200, { ...PERSON, allergyStatus: 'HAS_ALLERGIES' }),
      allergies: apiResult(200, []),
    })
    await renderPerson()

    expect(
      await screen.findByText('We could not load the allergies.'),
    ).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy()
  })

  it('does not show a list as empty when the allergies fail to load', async () => {
    respondWith({
      person: apiResult(200, {
        ...PERSON,
        allergyStatus: 'HAS_ALLERGIES',
      }),
      allergies: apiResult(500),
    })
    await renderPerson()

    expect(
      await screen.findByText('We could not load the allergies.'),
    ).toBeTruthy()
  })
})

describe('PersonScreen profile editing', () => {
  async function startEditing() {
    const user = userEvent.setup()
    await user.press(await screen.findByRole('button', { name: 'Edit' }))
    return user
  }

  it('saves the new name together with the unchanged birth date', async () => {
    jest
      .mocked(apiClient.PATCH)
      .mockResolvedValue(apiResult(200, { ...PERSON, name: 'Maxim' }))
    await renderPerson()
    const user = await startEditing()

    await user.clear(screen.getByLabelText('Name'))
    await user.type(screen.getByLabelText('Name'), 'Maxim')
    await user.press(screen.getByRole('button', { name: 'Save' }))

    expect(apiClient.PATCH).toHaveBeenCalledWith('/api/v1/people/{id}', {
      params: { path: { id: 'person-1' } },
      body: { name: 'Maxim', dateOfBirth: '1992-03-04' },
    })
    expect(await screen.findByRole('header', { name: 'Maxim' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Save' })).toBeNull()
  })

  it('does not send an empty name', async () => {
    await renderPerson()
    const user = await startEditing()

    await user.clear(screen.getByLabelText('Name'))
    await user.press(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('Enter a name.')).toBeTruthy()
    expect(apiClient.PATCH).not.toHaveBeenCalled()
  })

  it('keeps the form open and shows the error when the server refuses', async () => {
    jest.mocked(apiClient.PATCH).mockResolvedValue(apiResult(422))
    await renderPerson()
    const user = await startEditing()

    await user.press(screen.getByRole('button', { name: 'Save' }))

    expect(
      await screen.findByText('Please check the information and try again.'),
    ).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Save' })).toBeTruthy()
  })

  it('discards the changes on cancel', async () => {
    await renderPerson()
    const user = await startEditing()

    await user.clear(screen.getByLabelText('Name'))
    await user.type(screen.getByLabelText('Name'), 'Someone else')
    await user.press(screen.getByRole('button', { name: 'Cancel' }))

    expect(apiClient.PATCH).not.toHaveBeenCalled()
    expect(screen.queryByLabelText('Name')).toBeNull()
    expect(screen.getAllByText('Max')).toHaveLength(2)
    expect(screen.queryByText('Someone else')).toBeNull()
  })
})

describe('PersonScreen deleting the person', () => {
  async function askToDelete() {
    const user = userEvent.setup()
    await user.press(
      await screen.findByRole('button', { name: 'Delete profile' }),
    )
    return user
  }

  it('names the person and says that the data is erased for good', async () => {
    await renderPerson()
    await askToDelete()

    expect(screen.getByText('Delete Max?')).toBeTruthy()
    expect(
      screen.getByText(/permanently deletes the profile.*cannot be undone/),
    ).toBeTruthy()
    expect(apiClient.DELETE).not.toHaveBeenCalled()
  })

  it('keeps the person when the confirmation is cancelled', async () => {
    await renderPerson()
    const user = await askToDelete()

    await user.press(screen.getByRole('button', { name: 'Cancel' }))

    expect(apiClient.DELETE).not.toHaveBeenCalled()
    expect(mockBack).not.toHaveBeenCalled()
  })

  it('deletes the person, forgets the cached profile and goes back', async () => {
    jest.mocked(apiClient.DELETE).mockResolvedValue(apiResult(204))
    const queryClient = createTestQueryClient()
    queryClient.setQueryData(getPeopleListKey('active'), [PERSON])
    await renderWithQuery(<PersonScreen />, queryClient)
    const user = await askToDelete()

    await user.press(screen.getByRole('button', { name: 'Delete permanently' }))

    await waitFor(() => expect(mockBack).toHaveBeenCalledTimes(1))
    expect(apiClient.DELETE).toHaveBeenCalledWith('/api/v1/people/{id}', {
      params: { path: { id: 'person-1' } },
    })
    expect(queryClient.getQueryData(getPersonKey('person-1'))).toBeUndefined()
    expect(
      queryClient.getQueryData(getBodyParametersKey('person-1')),
    ).toBeUndefined()
    expect(
      queryClient.getQueryData(getExclusionsKey('person-1')),
    ).toBeUndefined()
    expect(
      queryClient.getQueryData(getPreferencesKey('person-1')),
    ).toBeUndefined()
    expect(
      queryClient.getQueryState(getPeopleListKey('active'))?.isInvalidated,
    ).toBe(true)
    expect(
      requestedPaths.filter((path) => path === '/api/v1/people/{id}'),
    ).toHaveLength(1)
  })

  it('opens the people list after deleting when there is no history', async () => {
    mockCanGoBack.mockReturnValue(false)
    jest.mocked(apiClient.DELETE).mockResolvedValue(apiResult(204))
    await renderPerson()
    const user = await askToDelete()

    await user.press(screen.getByRole('button', { name: 'Delete permanently' }))

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/'))
    expect(mockBack).not.toHaveBeenCalled()
  })

  it('stays on the screen and explains when the server refuses', async () => {
    jest.mocked(apiClient.DELETE).mockResolvedValue(apiResult(500))
    await renderPerson()
    const user = await askToDelete()

    await user.press(screen.getByRole('button', { name: 'Delete permanently' }))

    expect(
      await screen.findByText('The server had a problem. Please try again.'),
    ).toBeTruthy()
    expect(mockBack).not.toHaveBeenCalled()
    expect(screen.getByRole('header', { name: 'Max' })).toBeTruthy()
  })
})
