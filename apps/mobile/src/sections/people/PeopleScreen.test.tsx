import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, userEvent } from '@testing-library/react-native'

import { apiClient } from '@/api/apiClient'
import type { PersonListItem } from '@/api/types'
import { ERROR_MESSAGES } from '@/core/constants'
import { shouldRetryRequest } from '@/utils/errors'

import { PEOPLE_TEXT } from './constants'
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
  jest.mocked(apiClient.GET).mockResolvedValue({
    data,
    response: new Response(null, { status }),
  } as never)
}

async function renderPeople() {
  await render(
    <QueryClientProvider
      client={
        new QueryClient({
          defaultOptions: { queries: { retry: shouldRetryRequest } },
        })
      }
    >
      <PeopleScreen />
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('PeopleScreen', () => {
  it('asks only for active profiles', async () => {
    respondWith(200, [])

    await renderPeople()

    await screen.findByText(PEOPLE_TEXT.empty)
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
    expect(screen.getByText(PEOPLE_TEXT.noGoal)).toBeTruthy()
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
      pathname: '/goal/[personId]',
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

    expect(await screen.findByText(PEOPLE_TEXT.empty)).toBeTruthy()
  })

  it('shows a plain message when the API rejects the token', async () => {
    respondWith(401)

    await renderPeople()

    expect(await screen.findByText(ERROR_MESSAGES.SESSION_EXPIRED)).toBeTruthy()
  })

  it('lets the user try again after an error', async () => {
    respondWith(404)
    await renderPeople()
    await screen.findByText(ERROR_MESSAGES.NOT_FOUND)
    respondWith(200, [READY_PERSON])

    await userEvent
      .setup()
      .press(screen.getByRole('button', { name: PEOPLE_TEXT.retry }))

    expect(await screen.findByText('Max · 34')).toBeTruthy()
    expect(screen.queryByText(ERROR_MESSAGES.NOT_FOUND)).toBeNull()
  })

  it('lets the user log out', async () => {
    respondWith(200, [READY_PERSON])
    await renderPeople()

    await userEvent
      .setup()
      .press(screen.getByRole('button', { name: PEOPLE_TEXT.logOut }))

    expect(mockSignOut).toHaveBeenCalledTimes(1)
  })
})
