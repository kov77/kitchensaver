import { screen, userEvent, waitFor } from '@testing-library/react-native'

import { apiClient } from '@/api/apiClient'
import type { Preference } from '@/api/types'
import { apiError } from '@/test-utils/apiError'
import { apiResult } from '@/test-utils/apiResult'
import {
  createTestQueryClient,
  renderWithQuery,
} from '@/test-utils/renderWithQuery'

import { PreferencesCard } from './PreferencesCard'

jest.mock('@/api/apiClient', () => ({
  apiClient: {
    GET: jest.fn(),
    POST: jest.fn(),
    PATCH: jest.fn(),
    DELETE: jest.fn(),
  },
}))

const KIWI: Preference = {
  id: 'preference-1',
  ingredientName: 'Kiwi',
  rating: 4,
  updatedAt: '2026-11-01T10:00:00.000Z',
}

const CARROT: Preference = {
  id: 'preference-2',
  ingredientName: 'Carrot',
  rating: 2,
  updatedAt: '2026-11-01T10:00:00.000Z',
}

const SERVER_ERROR_TEXT = 'The server had a problem. Please try again.'

async function renderCard(preferences: Preference[] = []) {
  jest.mocked(apiClient.GET).mockResolvedValue(apiResult(200, preferences))
  const queryClient = createTestQueryClient()
  await renderWithQuery(<PreferencesCard personId="person-1" />, queryClient)
  await screen.findByRole('button', { name: 'Rate a food' })
  return queryClient
}

function press(role: 'button' | 'radio', name: string) {
  return userEvent.setup().press(screen.getByRole(role, { name }))
}

function ratingGroup(food: string) {
  return screen.getByLabelText(`Rating of ${food}`)
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('PreferencesCard loading', () => {
  it('asks the server for the ratings of this person', async () => {
    await renderCard([KIWI])

    expect(apiClient.GET).toHaveBeenCalledWith(
      '/api/v1/people/{id}/preferences',
      { params: { path: { id: 'person-1' } } },
    )
  })

  it('shows every food with its current rating selected', async () => {
    await renderCard([KIWI, CARROT])

    expect(screen.getByText('Kiwi')).toBeTruthy()
    expect(screen.getByText('Carrot')).toBeTruthy()
    expect(ratingGroup('Kiwi').props.accessibilityRole).toBe('radiogroup')
    expect(ratingGroup('Carrot').props.accessibilityRole).toBe('radiogroup')
    expect(
      screen.getByRole('radio', { name: 'Kiwi: 4' }).props.accessibilityState,
    ).toMatchObject({ checked: true })
    expect(
      screen.getByRole('radio', { name: 'Kiwi: 2' }).props.accessibilityState,
    ).toMatchObject({ checked: false })
  })

  it('says that nothing is rated only when the server returned an empty list', async () => {
    await renderCard([])

    expect(screen.getByText('No foods are rated yet.')).toBeTruthy()
  })

  it('never says that nothing is rated when the list cannot be loaded', async () => {
    jest.mocked(apiClient.GET).mockResolvedValue(apiResult(500))
    await renderWithQuery(<PreferencesCard personId="person-1" />)

    expect(
      await screen.findByText('We could not load the food ratings.'),
    ).toBeTruthy()
    expect(screen.queryByText('No foods are rated yet.')).toBeNull()
  })
})

describe('PreferencesCard adding', () => {
  async function openForm() {
    await press('button', 'Rate a food')
    return userEvent.setup()
  }

  it('sends the trimmed name with the chosen rating as a number', async () => {
    jest.mocked(apiClient.POST).mockResolvedValue(apiResult(201, KIWI))
    await renderCard()
    const user = await openForm()

    await user.type(screen.getByLabelText('Food'), ' Kiwi ')
    await press('radio', '5')
    await press('button', 'Save')

    await waitFor(() =>
      expect(apiClient.POST).toHaveBeenCalledWith(
        '/api/v1/people/{id}/preferences',
        {
          params: { path: { id: 'person-1' } },
          body: { ingredientName: 'Kiwi', rating: 5 },
        },
      ),
    )
  })

  it('needs a rating', async () => {
    await renderCard()
    const user = await openForm()

    await user.type(screen.getByLabelText('Food'), 'Kiwi')
    await press('button', 'Save')

    expect(await screen.findByText('Choose a rating.')).toBeTruthy()
    expect(apiClient.POST).not.toHaveBeenCalled()
  })

  it('says that the food is already rated', async () => {
    jest
      .mocked(apiClient.POST)
      .mockResolvedValue(apiError(409, 'PREFERENCE_ALREADY_EXISTS'))
    await renderCard()
    const user = await openForm()

    await user.type(screen.getByLabelText('Food'), 'kiwi')
    await press('radio', '3')
    await press('button', 'Save')

    expect(
      await screen.findByText('This food is already on the list.'),
    ).toBeTruthy()
  })
})

describe('PreferencesCard changing and removing', () => {
  it('sends the new rating for that food only', async () => {
    jest
      .mocked(apiClient.PATCH)
      .mockResolvedValue(apiResult(200, { ...CARROT, rating: 5 }))
    await renderCard([KIWI, CARROT])

    await press('radio', 'Carrot: 5')

    await waitFor(() =>
      expect(apiClient.PATCH).toHaveBeenCalledWith(
        '/api/v1/people/{id}/preferences/{preferenceId}',
        {
          params: { path: { id: 'person-1', preferenceId: 'preference-2' } },
          body: { rating: 5 },
        },
      ),
    )
    expect(apiClient.PATCH).toHaveBeenCalledTimes(1)
  })

  it('ignores a second tap while the rating is being saved', async () => {
    jest.mocked(apiClient.PATCH).mockReturnValue(new Promise(() => undefined))
    await renderCard([KIWI])
    await press('radio', 'Kiwi: 1')
    await press('radio', 'Kiwi: 2')

    expect(apiClient.PATCH).toHaveBeenCalledTimes(1)
  })

  it('refreshes the list after a rating change', async () => {
    jest.mocked(apiClient.PATCH).mockResolvedValue(apiResult(200, KIWI))
    await renderCard([KIWI])

    await press('radio', 'Kiwi: 1')

    await waitFor(() => expect(apiClient.GET).toHaveBeenCalledTimes(2))
  })

  it('shows the error when the rating cannot be saved', async () => {
    jest.mocked(apiClient.PATCH).mockResolvedValue(apiResult(500))
    await renderCard([KIWI])

    await press('radio', 'Kiwi: 1')

    expect(await screen.findByText(SERVER_ERROR_TEXT)).toBeTruthy()
  })

  it('removes the rating of the chosen food and refreshes the list', async () => {
    jest.mocked(apiClient.DELETE).mockResolvedValue(apiResult(204))
    await renderCard([KIWI, CARROT])

    await press('button', 'Remove the rating of Carrot')

    await waitFor(() =>
      expect(apiClient.DELETE).toHaveBeenCalledWith(
        '/api/v1/people/{id}/preferences/{preferenceId}',
        { params: { path: { id: 'person-1', preferenceId: 'preference-2' } } },
      ),
    )
    await waitFor(() => expect(apiClient.GET).toHaveBeenCalledTimes(2))
  })

  it('shows only the latest failure', async () => {
    jest.mocked(apiClient.PATCH).mockResolvedValue(apiResult(500))
    jest.mocked(apiClient.DELETE).mockResolvedValue(apiResult(204))
    await renderCard([KIWI, CARROT])
    await press('radio', 'Kiwi: 1')
    await screen.findByText(SERVER_ERROR_TEXT)

    await press('button', 'Remove the rating of Carrot')

    await waitFor(() =>
      expect(screen.queryByText(SERVER_ERROR_TEXT)).toBeNull(),
    )
  })

  it('does not say that nothing is rated when the refresh after a removal fails', async () => {
    jest.mocked(apiClient.DELETE).mockResolvedValue(apiResult(204))
    await renderCard([KIWI])
    jest.mocked(apiClient.GET).mockResolvedValue(apiResult(500))

    await press('button', 'Remove the rating of Kiwi')

    expect(
      await screen.findByText('We could not load the food ratings.'),
    ).toBeTruthy()
    expect(screen.queryByText('No foods are rated yet.')).toBeNull()
  })

  it('shows the error when the removal fails', async () => {
    jest.mocked(apiClient.DELETE).mockResolvedValue(apiResult(500))
    await renderCard([KIWI])

    await press('button', 'Remove the rating of Kiwi')

    expect(await screen.findByText(SERVER_ERROR_TEXT)).toBeTruthy()
    expect(screen.getByText('Kiwi')).toBeTruthy()
  })
})
