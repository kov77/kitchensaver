import { screen, userEvent, waitFor } from '@testing-library/react-native'

import { apiClient } from '@/api/apiClient'
import type { Preference } from '@/api/types'
import { apiError } from '@/test-utils/apiError'
import { apiResult } from '@/test-utils/apiResult'
import {
  createTestQueryClient,
  renderWithQuery,
} from '@/test-utils/renderWithQuery'
import { colors } from '@/theme/colors'

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
  await renderWithQuery(
    <PreferencesCard personId="person-1" personName="Alena" />,
    queryClient,
  )
  await screen.findByRole('button', { name: 'Add food' })
  return queryClient
}

function press(role: 'button', name: string) {
  return userEvent.setup().press(screen.getByRole(role, { name }))
}

function ratingOf(food: string) {
  return screen.getByLabelText(`Rating of ${food}`).props.accessibilityValue
    .text
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

  it('shows every food with its current rating', async () => {
    await renderCard([KIWI, CARROT])

    expect(screen.getByText('Kiwi')).toBeTruthy()
    expect(screen.getByText('Carrot')).toBeTruthy()
    expect(ratingOf('Kiwi')).toBe('4')
    expect(ratingOf('Carrot')).toBe('2')
  })

  it('says that nothing is rated only when the server returned an empty list', async () => {
    await renderCard([])

    expect(screen.getByText('No foods are rated yet.')).toBeTruthy()
  })

  it('never says that nothing is rated when the list cannot be loaded', async () => {
    jest.mocked(apiClient.GET).mockResolvedValue(apiResult(500))
    await renderWithQuery(
      <PreferencesCard personId="person-1" personName="Alena" />,
    )

    expect(
      await screen.findByText('We could not load the food ratings.'),
    ).toBeTruthy()
    expect(screen.queryByText('No foods are rated yet.')).toBeNull()
  })
})

describe('PreferencesCard adding', () => {
  async function openForm() {
    await press('button', 'Add food')
    return userEvent.setup()
  }

  it('opens a sheet with a title, a focused name field and the rating', async () => {
    await renderCard()
    await openForm()

    expect(screen.getByRole('header', { name: 'Add food' })).toBeTruthy()
    expect(screen.getByLabelText('Food').props.autoFocus).toBe(true)
    expect(screen.queryByText('Food')).toBeNull()
    expect(
      screen.getByLabelText('Rating (1 to 5)').props.accessibilityValue.text,
    ).toBe('3')
  })

  it('closes the sheet without adding anything', async () => {
    await renderCard()
    const user = await openForm()
    await user.type(screen.getByLabelText('Food'), 'Kiwi')

    await press('button', 'Close')

    expect(screen.queryByLabelText('Food')).toBeNull()
    expect(apiClient.POST).not.toHaveBeenCalled()
  })

  it('closes the sheet after the food is added', async () => {
    jest.mocked(apiClient.POST).mockResolvedValue(apiResult(201, KIWI))
    await renderCard()
    const user = await openForm()
    await user.type(screen.getByLabelText('Food'), 'Kiwi')

    await press('button', 'Add')

    await waitFor(() => expect(screen.queryByLabelText('Food')).toBeNull())
  })

  it('sends the trimmed name with the stepped rating as a number', async () => {
    jest.mocked(apiClient.POST).mockResolvedValue(apiResult(201, KIWI))
    await renderCard()
    const user = await openForm()

    await user.type(screen.getByLabelText('Food'), ' Kiwi ')
    await press('button', 'Raise the rating')
    await press('button', 'Raise the rating')
    await press('button', 'Add')

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

  it('starts at the neutral rating', async () => {
    jest.mocked(apiClient.POST).mockResolvedValue(apiResult(201, KIWI))
    await renderCard()
    const user = await openForm()

    await user.type(screen.getByLabelText('Food'), 'Kiwi')
    await press('button', 'Add')

    await waitFor(() =>
      expect(apiClient.POST).toHaveBeenCalledWith(
        '/api/v1/people/{id}/preferences',
        expect.objectContaining({
          body: { ingredientName: 'Kiwi', rating: 3 },
        }),
      ),
    )
  })

  it('does not step outside one to five in the form', async () => {
    await renderCard()
    await openForm()

    for (let step = 0; step < 6; step += 1) {
      await press('button', 'Raise the rating')
    }

    expect(screen.getAllByText('5').length).toBeGreaterThan(0)
    expect(screen.queryByText('6')).toBeNull()
  })

  it('needs a food name', async () => {
    await renderCard()
    await openForm()

    await press('button', 'Add')

    expect(await screen.findByText('This field is required.')).toBeTruthy()
    expect(apiClient.POST).not.toHaveBeenCalled()
  })

  it('says that the food is already rated', async () => {
    jest
      .mocked(apiClient.POST)
      .mockResolvedValue(apiError(409, 'PREFERENCE_ALREADY_EXISTS'))
    await renderCard()
    const user = await openForm()

    await user.type(screen.getByLabelText('Food'), 'kiwi')
    await press('button', 'Add')

    expect(
      await screen.findByText('This food is already on the list.'),
    ).toBeTruthy()
  })
})

describe('PreferencesCard changing and removing', () => {
  it('sends the new rating for that food only', async () => {
    jest
      .mocked(apiClient.PATCH)
      .mockResolvedValue(apiResult(200, { ...CARROT, rating: 3 }))
    await renderCard([KIWI, CARROT])

    await press('button', 'Raise the rating of Carrot')

    await waitFor(() =>
      expect(apiClient.PATCH).toHaveBeenCalledWith(
        '/api/v1/people/{id}/preferences/{preferenceId}',
        {
          params: { path: { id: 'person-1', preferenceId: 'preference-2' } },
          body: { rating: 3 },
        },
      ),
    )
    expect(apiClient.PATCH).toHaveBeenCalledTimes(1)
  })

  it('shows the new rating right away while it is being saved', async () => {
    jest.mocked(apiClient.PATCH).mockReturnValue(new Promise(() => undefined))
    await renderCard([KIWI, CARROT])

    await press('button', 'Raise the rating of Carrot')

    expect(ratingOf('Carrot')).toBe('3')
    expect(ratingOf('Kiwi')).toBe('4')
  })

  it('goes back to the saved rating when saving fails', async () => {
    jest.mocked(apiClient.PATCH).mockResolvedValue(apiResult(500))
    await renderCard([KIWI])

    await press('button', 'Raise the rating of Kiwi')

    expect(await screen.findByText(SERVER_ERROR_TEXT)).toBeTruthy()
    expect(ratingOf('Kiwi')).toBe('4')
  })

  it('ignores a second tap while the rating is being saved', async () => {
    jest.mocked(apiClient.PATCH).mockReturnValue(new Promise(() => undefined))
    await renderCard([KIWI])
    await press('button', 'Lower the rating of Kiwi')
    await press('button', 'Lower the rating of Kiwi')

    expect(apiClient.PATCH).toHaveBeenCalledTimes(1)
  })

  it('refreshes the list after a rating change', async () => {
    jest.mocked(apiClient.PATCH).mockResolvedValue(apiResult(200, KIWI))
    await renderCard([KIWI])

    await press('button', 'Lower the rating of Kiwi')

    await waitFor(() => expect(apiClient.GET).toHaveBeenCalledTimes(2))
  })

  it('shows the error when the rating cannot be saved', async () => {
    jest.mocked(apiClient.PATCH).mockResolvedValue(apiResult(500))
    await renderCard([KIWI])

    await press('button', 'Lower the rating of Kiwi')

    expect(await screen.findByText(SERVER_ERROR_TEXT)).toBeTruthy()
  })

  it('asks first and says what changes for the person', async () => {
    await renderCard([KIWI, CARROT])

    await press('button', 'Remove the rating of Carrot')

    expect(await screen.findByText('Remove the rating of Carrot?')).toBeTruthy()
    expect(
      screen.getByText(
        'Meal plans for Alena will no longer take this rating into account.',
      ),
    ).toBeTruthy()
    expect(apiClient.DELETE).not.toHaveBeenCalled()
  })

  it('colours the name of the food in the question', async () => {
    await renderCard([KIWI, CARROT])

    await press('button', 'Remove the rating of Carrot')

    const isColoured = screen
      .getAllByText('Carrot')
      .some(({ props }) => JSON.stringify(props.style).includes(colors.danger))
    expect(isColoured).toBe(true)
  })

  it('shows a food name with markup characters exactly as typed', async () => {
    const odd = { ...KIWI, ingredientName: 'Tom & <b>Jerry</b>' }
    await renderCard([odd])

    await press('button', 'Remove the rating of Tom & <b>Jerry</b>')

    expect(
      await screen.findByText('Remove the rating of Tom & <b>Jerry</b>?'),
    ).toBeTruthy()
  })

  it.each([
    '<i>x</i>',
    '<strong>x</strong>',
    'a<br/>b',
    '<highlight>x</highlight>',
    '</highlight>oops<highlight>',
    '{{name}} {{food}}',
    '<script>',
  ])(
    'shows the food name %j exactly as typed in the question',
    async (name) => {
      await renderCard([{ ...KIWI, ingredientName: name }])

      await press('button', `Remove the rating of ${name}`)

      expect(
        await screen.findByText(`Remove the rating of ${name}?`),
      ).toBeTruthy()
    },
  )

  it('keeps the rating when the question is cancelled', async () => {
    await renderCard([KIWI])

    await press('button', 'Remove the rating of Kiwi')
    await press('button', 'Cancel')

    expect(apiClient.DELETE).not.toHaveBeenCalled()
    expect(screen.getByText('Kiwi')).toBeTruthy()
  })

  it('removes the confirmed rating of the chosen food and refreshes the list', async () => {
    jest.mocked(apiClient.DELETE).mockResolvedValue(apiResult(204))
    await renderCard([KIWI, CARROT])

    await press('button', 'Remove the rating of Carrot')
    await press('button', 'Remove rating')

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
    await press('button', 'Lower the rating of Kiwi')
    await screen.findByText(SERVER_ERROR_TEXT)

    await press('button', 'Remove the rating of Carrot')
    await press('button', 'Remove rating')

    await waitFor(() =>
      expect(screen.queryByText(SERVER_ERROR_TEXT)).toBeNull(),
    )
  })

  it('does not say that nothing is rated when the refresh after a removal fails', async () => {
    jest.mocked(apiClient.DELETE).mockResolvedValue(apiResult(204))
    await renderCard([KIWI])
    jest.mocked(apiClient.GET).mockResolvedValue(apiResult(500))

    await press('button', 'Remove the rating of Kiwi')
    await press('button', 'Remove rating')

    expect(
      await screen.findByText('We could not load the food ratings.'),
    ).toBeTruthy()
    expect(screen.queryByText('No foods are rated yet.')).toBeNull()
  })

  it('shows the error when the removal fails', async () => {
    jest.mocked(apiClient.DELETE).mockResolvedValue(apiResult(500))
    await renderCard([KIWI])

    await press('button', 'Remove the rating of Kiwi')
    await press('button', 'Remove rating')

    expect(await screen.findByText(SERVER_ERROR_TEXT)).toBeTruthy()
    expect(screen.getByText('Kiwi')).toBeTruthy()
  })
})
