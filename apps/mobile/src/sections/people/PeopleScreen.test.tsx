import { QueryClient } from '@tanstack/react-query'
import { screen, userEvent } from '@testing-library/react-native'

import { apiClient } from '@/api/apiClient'
import type { PersonListItem } from '@/api/types'
import { shouldRetryRequest } from '@/utils/errors'
import { apiResult } from '@/test-utils/apiResult'
import { renderWithQuery } from '@/test-utils/renderWithQuery'

import { PeopleScreen } from './PeopleScreen'

const mockSignOut = jest.fn()
const mockPush = jest.fn()

jest.mock('@/api/apiClient', () => ({
  apiClient: { GET: jest.fn() },
}))

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}))

jest.mock('@/core/auth/SessionProvider', () => ({
  useSession: () => ({ signOut: mockSignOut }),
}))

const READY_PERSON: PersonListItem = {
  id: 'person-1',
  name: 'Max',
  age: 34,
  goal: { mode: 'MANUAL', goalType: 'LOSE', dailyKcal: 2100 },
  planReadiness: { ready: true, reasons: [] },
  archivedAt: null,
}

const NEW_PERSON: PersonListItem = {
  id: 'person-2',
  name: 'alena',
  age: 29,
  goal: null,
  planReadiness: { ready: false, reasons: ['MISSING_GOAL'] },
  archivedAt: null,
}

function respondWith(status: number, data?: unknown) {
  jest.mocked(apiClient.GET).mockResolvedValue(apiResult(status, data))
}

async function renderPeople() {
  await renderWithQuery(
    <PeopleScreen />,
    new QueryClient({
      defaultOptions: { queries: { retry: shouldRetryRequest } },
    }),
  )
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('PeopleScreen', () => {
  it('asks only for active profiles', async () => {
    respondWith(200, [])

    await renderPeople()

    await screen.findByText('There are no active profiles yet.')
    expect(apiClient.GET).toHaveBeenCalledWith('/api/v1/people', {
      params: { query: { status: 'active' } },
    })
  })

  it('shows each person with age and goal', async () => {
    respondWith(200, [READY_PERSON])

    await renderPeople()

    expect(await screen.findByText('Max · 34')).toBeTruthy()
    expect(screen.getByText('Lose weight · 2,100 kcal/day')).toBeTruthy()
    expect(screen.queryByText(/Not ready to plan/)).toBeNull()
  })

  it('tells why a profile cannot be planned yet', async () => {
    respondWith(200, [NEW_PERSON])

    await renderPeople()

    expect(await screen.findByText('alena · 29')).toBeTruthy()
    expect(screen.getByText('No goal yet')).toBeTruthy()
    expect(
      screen.getByText('Not ready to plan: add a daily calorie goal'),
    ).toBeTruthy()
  })

  it('opens the goal of the person that was pressed', async () => {
    respondWith(200, [READY_PERSON, NEW_PERSON])
    await renderPeople()

    await userEvent
      .setup()
      .press(await screen.findByRole('button', { name: /^alena, 29/ }))

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/person/[personId]',
      params: { personId: 'person-2' },
    })
  })

  it('reads the readiness hint aloud with the card', async () => {
    respondWith(200, [NEW_PERSON])

    await renderPeople()

    expect(
      await screen.findByRole('button', {
        name: /alena, 29\..*Not ready to plan: add a daily calorie goal/,
      }),
    ).toBeTruthy()
  })

  it('says so when there are no active profiles', async () => {
    respondWith(200, [])

    await renderPeople()

    expect(
      await screen.findByText('There are no active profiles yet.'),
    ).toBeTruthy()
  })

  it('shows a plain message when the API rejects the token', async () => {
    respondWith(401)

    await renderPeople()

    expect(
      await screen.findByText('Your session has expired. Please log in again.'),
    ).toBeTruthy()
  })

  it('lets the user try again after an error', async () => {
    respondWith(404)
    await renderPeople()
    await screen.findByText('We could not find what you were looking for.')
    respondWith(200, [READY_PERSON])

    await userEvent
      .setup()
      .press(screen.getByRole('button', { name: 'Try again' }))

    expect(await screen.findByText('Max · 34')).toBeTruthy()
    expect(
      screen.queryByText('We could not find what you were looking for.'),
    ).toBeNull()
  })

  it('starts adding another person', async () => {
    respondWith(200, [READY_PERSON])
    await renderPeople()
    await screen.findByText('Max · 34')

    await userEvent
      .setup()
      .press(screen.getByRole('button', { name: 'Add person' }))

    expect(mockPush).toHaveBeenCalledWith('/add-person')
  })

  it('offers no way to add a person until the list is loaded', async () => {
    respondWith(403)

    await renderPeople()
    await screen.findByText('You do not have access to this.')

    expect(screen.queryByRole('button', { name: 'Add person' })).toBeNull()
  })

  it('lets the user log out', async () => {
    respondWith(200, [READY_PERSON])
    await renderPeople()

    await userEvent
      .setup()
      .press(screen.getByRole('button', { name: 'Log out' }))

    expect(mockSignOut).toHaveBeenCalledTimes(1)
  })
})
