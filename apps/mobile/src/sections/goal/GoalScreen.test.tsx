import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, userEvent } from '@testing-library/react-native'

import { PEOPLE_QUERY_KEY } from '@/api/constants'
import { GOAL_EDITOR_TEXT } from '@/components/organisms/goal/constants'
import { ERROR_MESSAGES } from '@/core/constants'

import { GOAL_TEXT } from './constants'
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

function respond(status: number, data?: unknown) {
  return { data, response: new Response(null, { status }) }
}

async function renderGoal() {
  await render(
    <QueryClientProvider client={queryClient}>
      <GoalScreen />
    </QueryClientProvider>,
  )
}

async function fillManualGoal() {
  const user = userEvent.setup()
  await user.press(
    screen.getByRole('radio', { name: GOAL_EDITOR_TEXT.modeManual }),
  )
  await user.press(screen.getByRole('radio', { name: 'Maintain weight' }))
  await user.type(screen.getByLabelText(GOAL_EDITOR_TEXT.kcalLabel), '2200')
}

function pressSave() {
  return userEvent
    .setup()
    .press(screen.getByRole('button', { name: GOAL_TEXT.save }))
}

beforeEach(() => {
  jest.clearAllMocks()
  queryClient = new QueryClient()
})

describe('GoalScreen', () => {
  it('saves the goal for the person in the route and goes back', async () => {
    mockPut.mockResolvedValue(respond(200, { dailyKcal: 2200 }))
    await renderGoal()
    await fillManualGoal()

    await pressSave()

    expect(mockPut).toHaveBeenCalledWith('/api/v1/people/{id}/goal', {
      params: { path: { id: 'person-7' } },
      body: { mode: 'MANUAL', goalType: 'MAINTAIN', dailyKcal: 2200 },
    })
    await screen.findByRole('button', { name: GOAL_TEXT.save })
    expect(mockBack).toHaveBeenCalledTimes(1)
  })

  it('refreshes the people list so the readiness hint can go away', async () => {
    const peopleKey = [...PEOPLE_QUERY_KEY, 'active']
    queryClient.setQueryData(peopleKey, [])
    mockPut.mockResolvedValue(respond(200, { dailyKcal: 2200 }))
    await renderGoal()
    await fillManualGoal()

    await pressSave()

    await screen.findByRole('button', { name: GOAL_TEXT.save })
    expect(queryClient.getQueryState(peopleKey)?.isInvalidated).toBe(true)
  })

  it('stays on the screen with a plain message when saving fails', async () => {
    mockPut.mockResolvedValue(respond(503))
    await renderGoal()
    await fillManualGoal()

    await pressSave()

    expect(await screen.findByText(ERROR_MESSAGES.SERVER)).toBeTruthy()
    expect(mockBack).not.toHaveBeenCalled()
  })

  it('asks the server to estimate for the person in the route', async () => {
    mockPost.mockResolvedValue(
      respond(200, {
        estimatedMaintenanceKcal: 2275,
        methodology: 'DRI',
        assumptions: ['AGE_IN_COMPLETED_YEARS'],
      }),
    )
    const user = userEvent.setup()
    await renderGoal()
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

    expect(await screen.findByText(GOAL_EDITOR_TEXT.disclaimer)).toBeTruthy()
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
      .press(screen.getByRole('button', { name: GOAL_TEXT.cancel }))

    expect(mockBack).toHaveBeenCalledTimes(1)
    expect(mockPut).not.toHaveBeenCalled()
  })
})
