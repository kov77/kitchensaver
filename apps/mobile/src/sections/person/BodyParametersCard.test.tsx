import { screen, userEvent, waitFor } from '@testing-library/react-native'

import { apiClient } from '@/api/apiClient'
import type { StoredBodyParameters } from '@/api/types'
import { apiError } from '@/test-utils/apiError'
import { apiResult } from '@/test-utils/apiResult'
import {
  createTestQueryClient,
  renderWithQuery,
} from '@/test-utils/renderWithQuery'

import { BodyParametersCard } from './BodyParametersCard'

jest.mock('@/api/apiClient', () => ({
  apiClient: { GET: jest.fn(), PUT: jest.fn(), DELETE: jest.fn() },
}))

const STORED: StoredBodyParameters = {
  heightCm: 165,
  weightKg: 63.5,
  activityLevel: 'LOW_ACTIVE',
  formulaSex: 'FEMALE',
  updatedAt: '2026-11-01T12:00:00.000Z',
}

const NOT_SAVED = apiError(404, 'BODY_PARAMETERS_NOT_FOUND')
const SERVER_ERROR_TEXT = 'The server had a problem. Please try again.'

async function renderCard(response: ReturnType<typeof apiResult>) {
  jest.mocked(apiClient.GET).mockResolvedValue(response)
  const queryClient = createTestQueryClient()
  await renderWithQuery(
    <BodyParametersCard personId="person-1" personName="Alena" />,
    queryClient,
  )
  return queryClient
}

async function renderSaved() {
  const queryClient = await renderCard(apiResult(200, STORED))
  await screen.findByRole('button', { name: 'Edit measurements' })
  return queryClient
}

async function renderEmpty() {
  const queryClient = await renderCard(NOT_SAVED)
  await screen.findByRole('button', { name: 'Add measurements' })
  return queryClient
}

function press(role: 'button' | 'radio', name: string) {
  return userEvent.setup().press(screen.getByRole(role, { name }))
}

async function fillForm({ height = '180', weight = '75,5' } = {}) {
  const user = userEvent.setup()
  await user.clear(screen.getByLabelText('Height (cm)'))
  await user.type(screen.getByLabelText('Height (cm)'), height)
  await user.clear(screen.getByLabelText('Weight (kg)'))
  await user.type(screen.getByLabelText('Weight (kg)'), weight)
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('BodyParametersCard loading', () => {
  it('asks the server for the measurements of this person', async () => {
    await renderSaved()

    expect(apiClient.GET).toHaveBeenCalledWith(
      '/api/v1/people/{id}/body-parameters',
      { params: { path: { id: 'person-1' } } },
    )
  })

  it('explains what the measurements are for, before anything is saved', async () => {
    await renderEmpty()

    expect(
      screen.getByText(/Saved only to recalculate the calorie estimate/),
    ).toBeTruthy()
  })

  it('shows every saved value in words and when it was saved', async () => {
    await renderSaved()

    expect(screen.getByText('Height: 165 cm')).toBeTruthy()
    expect(screen.getByText('Weight: 63.5 kg')).toBeTruthy()
    expect(screen.getByText('Activity level: Low active')).toBeTruthy()
    expect(screen.getByText('Sex used in the formula: Female')).toBeTruthy()
    expect(screen.getByText('Saved on 1 November 2026')).toBeTruthy()
  })

  it('says that nothing is saved when the server has no measurements', async () => {
    await renderEmpty()

    expect(screen.getByText('No measurements are saved.')).toBeTruthy()
    expect(
      screen.queryByRole('button', { name: 'Delete measurements' }),
    ).toBeNull()
    expect(screen.queryByText('We could not load the measurements.')).toBeNull()
  })

  it('does not take a missing person for missing measurements', async () => {
    await renderCard(apiError(404, 'PERSON_NOT_FOUND'))

    expect(
      await screen.findByText('We could not load the measurements.'),
    ).toBeTruthy()
    expect(screen.queryByText('No measurements are saved.')).toBeNull()
  })

  it('shows a failure and loads again on retry', async () => {
    await renderCard(apiResult(500))
    await screen.findByText('We could not load the measurements.')

    jest.mocked(apiClient.GET).mockResolvedValue(apiResult(200, STORED))
    await press('button', 'Try again')

    expect(await screen.findByText('Height: 165 cm')).toBeTruthy()
  })
})

describe('BodyParametersCard saving', () => {
  it('saves the first measurements as numbers', async () => {
    jest.mocked(apiClient.PUT).mockResolvedValue(apiResult(200, STORED))
    await renderEmpty()
    await press('button', 'Add measurements')

    await fillForm()
    await press('radio', 'Active')
    await press('radio', 'Male')
    await press('button', 'Save')

    await waitFor(() =>
      expect(apiClient.PUT).toHaveBeenCalledWith(
        '/api/v1/people/{id}/body-parameters',
        {
          params: { path: { id: 'person-1' } },
          body: {
            heightCm: 180,
            weightKg: 75.5,
            activityLevel: 'ACTIVE',
            formulaSex: 'MALE',
          },
        },
      ),
    )
    await waitFor(() =>
      expect(screen.queryByLabelText('Height (cm)')).toBeNull(),
    )
  })

  it('opens the form filled with the saved values', async () => {
    await renderSaved()

    await press('button', 'Edit measurements')

    expect(screen.getByLabelText('Height (cm)').props.value).toBe('165')
    expect(screen.getByLabelText('Weight (kg)').props.value).toBe('63.5')
    expect(
      screen.getByRole('radio', { name: 'Low active' }).props
        .accessibilityState,
    ).toMatchObject({ checked: true })
    expect(
      screen.getByRole('radio', { name: 'Female' }).props.accessibilityState,
    ).toMatchObject({ checked: true })
  })

  it('saves a changed weight and keeps the other values', async () => {
    jest.mocked(apiClient.PUT).mockResolvedValue(apiResult(200, STORED))
    await renderSaved()
    await press('button', 'Edit measurements')
    const user = userEvent.setup()

    await user.clear(screen.getByLabelText('Weight (kg)'))
    await user.type(screen.getByLabelText('Weight (kg)'), '61')
    await press('button', 'Save')

    await waitFor(() =>
      expect(apiClient.PUT).toHaveBeenCalledWith(
        '/api/v1/people/{id}/body-parameters',
        {
          params: { path: { id: 'person-1' } },
          body: {
            heightCm: 165,
            weightKg: 61,
            activityLevel: 'LOW_ACTIVE',
            formulaSex: 'FEMALE',
          },
        },
      ),
    )
  })

  it('refreshes the measurements after saving', async () => {
    jest.mocked(apiClient.PUT).mockResolvedValue(apiResult(200, STORED))
    await renderEmpty()
    await press('button', 'Add measurements')
    await fillForm()
    await press('radio', 'Active')
    await press('radio', 'Male')

    await press('button', 'Save')

    await waitFor(() => expect(apiClient.GET).toHaveBeenCalledTimes(2))
  })

  it('does not send values outside the accepted range', async () => {
    await renderEmpty()
    await press('button', 'Add measurements')

    await fillForm({ height: '80', weight: '500' })
    await press('radio', 'Active')
    await press('radio', 'Male')
    await press('button', 'Save')

    expect(
      await screen.findByText('Enter a height between 90 and 250 cm.'),
    ).toBeTruthy()
    expect(
      screen.getByText('Enter a weight between 20 and 400 kg.'),
    ).toBeTruthy()
    expect(apiClient.PUT).not.toHaveBeenCalled()
  })

  it('asks to choose the activity level and the sex', async () => {
    await renderEmpty()
    await press('button', 'Add measurements')

    await fillForm()
    await press('button', 'Save')

    expect(await screen.findAllByText('This field is required.')).toHaveLength(2)
    expect(apiClient.PUT).not.toHaveBeenCalled()
  })

  it('keeps the form and shows the error when the server refuses', async () => {
    jest.mocked(apiClient.PUT).mockResolvedValue(apiResult(500))
    await renderSaved()
    await press('button', 'Edit measurements')

    await press('button', 'Save')

    expect(await screen.findByText(SERVER_ERROR_TEXT)).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Save' })).toBeTruthy()
  })

  it('leaves the saved values untouched on cancel', async () => {
    await renderSaved()
    await press('button', 'Edit measurements')
    const user = userEvent.setup()
    await user.clear(screen.getByLabelText('Weight (kg)'))
    await user.type(screen.getByLabelText('Weight (kg)'), '40')

    await press('button', 'Cancel')

    expect(apiClient.PUT).not.toHaveBeenCalled()
    expect(screen.getByText('Weight: 63.5 kg')).toBeTruthy()
  })

  it('sends one request when the save button is pressed twice', async () => {
    jest.mocked(apiClient.PUT).mockReturnValue(new Promise(() => undefined))
    await renderSaved()
    await press('button', 'Edit measurements')

    await press('button', 'Save')
    await press('button', 'Save')

    expect(apiClient.PUT).toHaveBeenCalledTimes(1)
  })
})

describe('BodyParametersCard deleting', () => {
  it('asks first and says that the goal does not change', async () => {
    await renderSaved()

    await press('button', 'Delete measurements')

    expect(
      await screen.findByText('Delete the saved measurements?'),
    ).toBeTruthy()
    expect(
      screen.getByText(/of Alena will be deleted. The goal does not change./),
    ).toBeTruthy()
    expect(apiClient.DELETE).not.toHaveBeenCalled()
  })

  it('keeps the measurements when the question is cancelled', async () => {
    await renderSaved()

    await press('button', 'Delete measurements')
    await press('button', 'Cancel')

    expect(apiClient.DELETE).not.toHaveBeenCalled()
    expect(screen.getByText('Height: 165 cm')).toBeTruthy()
  })

  it('deletes the confirmed measurements and loads the list again', async () => {
    jest.mocked(apiClient.DELETE).mockResolvedValue(apiResult(204))
    await renderSaved()

    await press('button', 'Delete measurements')
    await press('button', 'Delete')

    await waitFor(() =>
      expect(apiClient.DELETE).toHaveBeenCalledWith(
        '/api/v1/people/{id}/body-parameters',
        { params: { path: { id: 'person-1' } } },
      ),
    )
    await waitFor(() => expect(apiClient.GET).toHaveBeenCalledTimes(2))
  })

  it('refreshes even when the measurements are already gone', async () => {
    jest
      .mocked(apiClient.DELETE)
      .mockResolvedValue(apiError(404, 'BODY_PARAMETERS_NOT_FOUND'))
    await renderSaved()

    await press('button', 'Delete measurements')
    await press('button', 'Delete')

    await waitFor(() => expect(apiClient.GET).toHaveBeenCalledTimes(2))
  })

  it('shows the error when the removal fails', async () => {
    jest.mocked(apiClient.DELETE).mockResolvedValue(apiResult(500))
    await renderSaved()

    await press('button', 'Delete measurements')
    await press('button', 'Delete')

    expect(await screen.findByText(SERVER_ERROR_TEXT)).toBeTruthy()
    expect(screen.getByText('Height: 165 cm')).toBeTruthy()
  })
})
