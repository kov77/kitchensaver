import { QueryClient } from '@tanstack/react-query'
import { screen, userEvent } from '@testing-library/react-native'

import { getPeopleListKey } from '@/api/queryKeys'
import { apiResult } from '@/test-utils/apiResult'
import {
  createTestQueryClient,
  renderWithQuery,
} from '@/test-utils/renderWithQuery'

import { GoalScreen } from './GoalScreen'

const mockBack = jest.fn()
const mockPost = jest.fn()
const mockPut = jest.fn()

jest.mock('@/api/apiClient', () => ({
  apiClient: {
    POST: (path: string, options: object) => mockPost(path, options),
    PUT: (path: string, options: object) => mockPut(path, options),
  },
}))

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ personId: 'person-7' }),
  useRouter: () => ({ back: mockBack }),
}))

let queryClient: QueryClient

async function renderGoal() {
  await renderWithQuery(<GoalScreen />, queryClient)
}

async function fillManualGoal() {
  const user = userEvent.setup()
  await user.press(
    screen.getByRole('radio', { name: 'I already know my daily calories' }),
  )
  await user.press(screen.getByRole('radio', { name: 'Maintain weight' }))
  await user.type(screen.getByLabelText('Daily calories (kcal)'), '2200')
}

function pressSave() {
  return userEvent
    .setup()
    .press(screen.getByRole('button', { name: 'Save goal' }))
}

beforeEach(() => {
  jest.clearAllMocks()
  queryClient = createTestQueryClient()
})

describe('GoalScreen', () => {
  it('saves the goal for the person in the route and goes back', async () => {
    mockPut.mockResolvedValue(apiResult(200, { dailyKcal: 2200 }))
    await renderGoal()
    await fillManualGoal()

    await pressSave()

    expect(mockPut).toHaveBeenCalledWith('/api/v1/people/{id}/goal', {
      params: { path: { id: 'person-7' } },
      body: { mode: 'MANUAL', goalType: 'MAINTAIN', dailyKcal: 2200 },
    })
    await screen.findByRole('button', { name: 'Save goal' })
    expect(mockBack).toHaveBeenCalledTimes(1)
  })

  it('refreshes the people list so the readiness hint can go away', async () => {
    const peopleKey = getPeopleListKey('active')
    queryClient.setQueryData(peopleKey, [])
    mockPut.mockResolvedValue(apiResult(200, { dailyKcal: 2200 }))
    await renderGoal()
    await fillManualGoal()

    await pressSave()

    await screen.findByRole('button', { name: 'Save goal' })
    expect(queryClient.getQueryState(peopleKey)?.isInvalidated).toBe(true)
  })

  it('stays on the screen with a plain message when saving fails', async () => {
    mockPut.mockResolvedValue(apiResult(503))
    await renderGoal()
    await fillManualGoal()

    await pressSave()

    expect(
      await screen.findByText('The server had a problem. Please try again.'),
    ).toBeTruthy()
    expect(mockBack).not.toHaveBeenCalled()
  })

  it('asks the server to estimate for the person in the route', async () => {
    mockPost.mockResolvedValue(
      apiResult(200, {
        estimatedMaintenanceKcal: 2275,
        methodology: 'DRI',
        assumptions: ['AGE_IN_COMPLETED_YEARS'],
      }),
    )
    const user = userEvent.setup()
    await renderGoal()
    await user.press(screen.getByRole('radio', { name: 'Help me estimate' }))
    await user.press(screen.getByRole('radio', { name: 'Maintain weight' }))
    await user.type(screen.getByLabelText('Height (cm)'), '165')
    await user.type(screen.getByLabelText('Weight (kg)'), '63')
    await user.press(screen.getByRole('radio', { name: 'Low active' }))
    await user.press(screen.getByRole('radio', { name: 'Female' }))

    await user.press(screen.getByRole('button', { name: 'Calculate estimate' }))

    expect(
      await screen.findByText(
        'This is an estimate for information only. It is not medical advice.',
      ),
    ).toBeTruthy()
    expect(mockPost).toHaveBeenCalledWith(
      '/api/v1/people/{id}/goals/estimate',
      {
        params: { path: { id: 'person-7' } },
        body: {
          goalType: 'MAINTAIN',
          heightCm: 165,
          weightKg: 63,
          activityLevel: 'LOW_ACTIVE',
          formulaSex: 'FEMALE',
        },
      },
    )
  })

  it('goes back without saving when cancelled', async () => {
    await renderGoal()

    await userEvent
      .setup()
      .press(screen.getByRole('button', { name: 'Cancel' }))

    expect(mockBack).toHaveBeenCalledTimes(1)
    expect(mockPut).not.toHaveBeenCalled()
  })
})
