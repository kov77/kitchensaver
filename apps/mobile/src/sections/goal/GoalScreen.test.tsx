import { onlineManager, QueryClient } from '@tanstack/react-query'
import { screen, userEvent, waitFor } from '@testing-library/react-native'

import { getBodyParametersKey, getPeopleListKey } from '@/api/queryKeys'
import { apiError } from '@/test-utils/apiError'
import { apiResult } from '@/test-utils/apiResult'
import {
  createTestQueryClient,
  renderWithQuery,
} from '@/test-utils/renderWithQuery'

import { GoalScreen } from './GoalScreen'

const mockBack = jest.fn()
const mockGet = jest.fn()
const mockPost = jest.fn()
const mockPut = jest.fn()

jest.mock('@/api/apiClient', () => ({
  apiClient: {
    GET: (path: string, options: object) => mockGet(path, options),
    POST: (path: string, options: object) => mockPost(path, options),
    PUT: (path: string, options: object) => mockPut(path, options),
  },
}))

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ personId: 'person-7' }),
  useRouter: () => ({ back: mockBack }),
}))

let queryClient: QueryClient

const SAVED_PARAMETERS = {
  heightCm: 168,
  weightKg: 64.5,
  activityLevel: 'ACTIVE',
  formulaSex: 'FEMALE',
  updatedAt: '2026-11-01T10:00:00.000Z',
}

async function renderGoal() {
  await renderWithQuery(<GoalScreen />, queryClient)
  await screen.findByRole('radio', { name: 'Help me estimate' })
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

afterEach(() => {
  onlineManager.setOnline(true)
})

beforeEach(() => {
  jest.clearAllMocks()
  queryClient = createTestQueryClient()
  mockGet.mockResolvedValue(apiError(404, 'BODY_PARAMETERS_NOT_FOUND'))
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

describe('GoalScreen saved measurements', () => {
  async function openEstimate() {
    await renderGoal()
    await userEvent
      .setup()
      .press(screen.getByRole('radio', { name: 'Help me estimate' }))
  }

  it('asks for the saved measurements of the person in the route', async () => {
    await renderGoal()

    expect(mockGet).toHaveBeenCalledWith(
      '/api/v1/people/{id}/body-parameters',
      { params: { path: { id: 'person-7' } } },
    )
  })

  it('waits for the saved measurements before showing the choice', async () => {
    mockGet.mockReturnValue(new Promise(() => undefined))
    await renderWithQuery(<GoalScreen />, queryClient)

    expect(screen.getByLabelText('Loading')).toBeTruthy()
    expect(screen.queryByRole('radio', { name: 'Help me estimate' })).toBeNull()
  })

  it('fills the estimate form with the saved measurements', async () => {
    mockGet.mockResolvedValue(apiResult(200, SAVED_PARAMETERS))
    await openEstimate()

    expect(screen.getByLabelText('Height (cm)').props.value).toBe('168')
    expect(screen.getByLabelText('Weight (kg)').props.value).toBe('64.5')
    expect(
      screen.getByRole('radio', { name: 'Active' }).props.accessibilityState,
    ).toMatchObject({ checked: true })
    expect(
      screen.getByRole('radio', { name: 'Female' }).props.accessibilityState,
    ).toMatchObject({ checked: true })
  })

  it('does not choose the goal for the person', async () => {
    mockGet.mockResolvedValue(apiResult(200, SAVED_PARAMETERS))
    await openEstimate()

    expect(
      screen.getByRole('radio', { name: 'Maintain weight' }).props
        .accessibilityState,
    ).toMatchObject({ checked: false })
  })

  it('leaves the form empty when nothing is saved', async () => {
    await openEstimate()

    expect(screen.getByLabelText('Height (cm)').props.value).toBe('')
    expect(screen.getByLabelText('Weight (kg)').props.value).toBe('')
  })

  it('still lets the goal be set when the saved measurements cannot be loaded, and says so', async () => {
    mockGet.mockResolvedValue(apiResult(500))
    await openEstimate()

    expect(screen.getByLabelText('Height (cm)').props.value).toBe('')
    expect(
      screen.getByRole('button', { name: 'Calculate estimate' }),
    ).toBeTruthy()
    expect(
      screen.getByText(
        'Saved measurements could not be loaded, so the form starts empty.',
      ),
    ).toBeTruthy()
  })

  it('does not wait for the measurements when the device is offline', async () => {
    onlineManager.setOnline(false)
    await renderGoal()

    expect(screen.queryByLabelText('Loading')).toBeNull()
    expect(
      screen.getByRole('radio', { name: 'I already know my daily calories' }),
    ).toBeTruthy()
  })

  it('keeps what was typed when the connection comes back and the measurements load', async () => {
    let answer: (response: unknown) => void = () => undefined
    mockGet.mockReturnValue(new Promise((resolve) => (answer = resolve)))
    onlineManager.setOnline(false)
    await renderGoal()
    const user = userEvent.setup()
    await user.press(screen.getByRole('radio', { name: 'Help me estimate' }))
    await user.type(screen.getByLabelText('Height (cm)'), '171')

    onlineManager.setOnline(true)
    await waitFor(() => expect(mockGet).toHaveBeenCalled())

    expect(screen.getByLabelText('Height (cm)').props.value).toBe('171')
    expect(screen.queryByLabelText('Loading')).toBeNull()

    answer(apiResult(200, SAVED_PARAMETERS))
    await waitFor(() =>
      expect(
        queryClient.getQueryData(getBodyParametersKey('person-7')),
      ).toEqual(SAVED_PARAMETERS),
    )
    expect(screen.getByLabelText('Height (cm)').props.value).toBe('171')
  })

  it('does not warn about measurements when nothing is saved', async () => {
    await renderGoal()

    expect(
      screen.queryByText(
        'Saved measurements could not be loaded, so the form starts empty.',
      ),
    ).toBeNull()
  })

  it('sends what the user sees, not what was saved, when the values are changed', async () => {
    mockGet.mockResolvedValue(apiResult(200, SAVED_PARAMETERS))
    mockPost.mockResolvedValue(
      apiResult(200, {
        estimatedMaintenanceKcal: 2200,
        methodology: 'DRI',
        assumptions: [],
      }),
    )
    await openEstimate()
    const user = userEvent.setup()

    await user.clear(screen.getByLabelText('Weight (kg)'))
    await user.type(screen.getByLabelText('Weight (kg)'), '60')
    await user.press(screen.getByRole('radio', { name: 'Maintain weight' }))
    await user.press(screen.getByRole('button', { name: 'Calculate estimate' }))

    await screen.findByText('Your estimate')
    expect(mockPost).toHaveBeenCalledWith(
      '/api/v1/people/{id}/goals/estimate',
      {
        params: { path: { id: 'person-7' } },
        body: {
          goalType: 'MAINTAIN',
          heightCm: 168,
          weightKg: 60,
          activityLevel: 'ACTIVE',
          formulaSex: 'FEMALE',
        },
      },
    )
  })
})
