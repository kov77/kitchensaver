import { screen, userEvent, waitFor } from '@testing-library/react-native'

import { apiClient } from '@/api/apiClient'
import type { Exclusion } from '@/api/types'
import { apiError } from '@/test-utils/apiError'
import { apiResult } from '@/test-utils/apiResult'
import {
  createTestQueryClient,
  renderWithQuery,
} from '@/test-utils/renderWithQuery'

import { ExclusionsCard } from './ExclusionsCard'

jest.mock('@/api/apiClient', () => ({
  apiClient: { GET: jest.fn(), POST: jest.fn(), DELETE: jest.fn() },
}))

const MUSHROOMS: Exclusion = {
  id: 'exclusion-1',
  ingredientName: 'Mushrooms',
  createdAt: '2026-11-01T10:00:00.000Z',
}

const OLIVES: Exclusion = {
  id: 'exclusion-2',
  ingredientName: 'Olives',
  createdAt: '2026-11-01T10:00:00.000Z',
}

const SERVER_ERROR_TEXT = 'The server had a problem. Please try again.'

async function renderCard(exclusions: Exclusion[] = []) {
  jest.mocked(apiClient.GET).mockResolvedValue(apiResult(200, exclusions))
  const queryClient = createTestQueryClient()
  await renderWithQuery(
    <ExclusionsCard personId="person-1" personName="Max" />,
    queryClient,
  )
  await screen.findByRole('button', { name: 'Add food' })
  return queryClient
}

function press(role: 'button', name: string) {
  return userEvent.setup().press(screen.getByRole(role, { name }))
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('ExclusionsCard loading', () => {
  it('asks the server for the excluded foods of this person', async () => {
    await renderCard([MUSHROOMS])

    expect(apiClient.GET).toHaveBeenCalledWith(
      '/api/v1/people/{id}/exclusions',
      { params: { path: { id: 'person-1' } } },
    )
  })

  it('lists the excluded foods', async () => {
    await renderCard([MUSHROOMS, OLIVES])

    expect(screen.getByText('Mushrooms')).toBeTruthy()
    expect(screen.getByText('Olives')).toBeTruthy()
  })

  it('says that nothing is excluded only when the server returned an empty list', async () => {
    await renderCard([])

    expect(screen.getByText('No foods are excluded.')).toBeTruthy()
  })

  it('never says that nothing is excluded when the list cannot be loaded', async () => {
    jest.mocked(apiClient.GET).mockResolvedValue(apiResult(500))
    await renderWithQuery(
      <ExclusionsCard personId="person-1" personName="Max" />,
    )

    expect(
      await screen.findByText('We could not load the excluded foods.'),
    ).toBeTruthy()
    expect(screen.queryByText('No foods are excluded.')).toBeNull()
  })

  it('loads again on retry', async () => {
    jest.mocked(apiClient.GET).mockResolvedValue(apiResult(500))
    await renderWithQuery(
      <ExclusionsCard personId="person-1" personName="Max" />,
    )
    await screen.findByText('We could not load the excluded foods.')

    jest.mocked(apiClient.GET).mockResolvedValue(apiResult(200, [MUSHROOMS]))
    await press('button', 'Try again')

    expect(await screen.findByText('Mushrooms')).toBeTruthy()
  })
})

describe('ExclusionsCard adding', () => {
  async function openForm() {
    await press('button', 'Add food')
    return userEvent.setup()
  }

  it('sends the trimmed name and closes the form', async () => {
    jest.mocked(apiClient.POST).mockResolvedValue(apiResult(201, MUSHROOMS))
    await renderCard()
    const user = await openForm()

    await user.type(screen.getByLabelText('Food'), '  Mushrooms ')
    await press('button', 'Save')

    await waitFor(() =>
      expect(apiClient.POST).toHaveBeenCalledWith(
        '/api/v1/people/{id}/exclusions',
        {
          params: { path: { id: 'person-1' } },
          body: { ingredientName: 'Mushrooms' },
        },
      ),
    )
    await waitFor(() => expect(screen.queryByLabelText('Food')).toBeNull())
  })

  it('does not send an empty name', async () => {
    await renderCard()
    await openForm()

    await press('button', 'Save')

    expect(await screen.findByText('Enter a food.')).toBeTruthy()
    expect(apiClient.POST).not.toHaveBeenCalled()
  })

  it('refreshes the list after adding', async () => {
    jest.mocked(apiClient.POST).mockResolvedValue(apiResult(201, MUSHROOMS))
    await renderCard()
    const user = await openForm()

    await user.type(screen.getByLabelText('Food'), 'Mushrooms')
    await press('button', 'Save')

    await waitFor(() => expect(apiClient.GET).toHaveBeenCalledTimes(2))
  })

  it('says that the food is already on the list', async () => {
    jest
      .mocked(apiClient.POST)
      .mockResolvedValue(apiError(409, 'EXCLUSION_ALREADY_EXISTS'))
    await renderCard([MUSHROOMS])
    const user = await openForm()

    await user.type(screen.getByLabelText('Food'), 'mushrooms')
    await press('button', 'Save')

    expect(
      await screen.findByText('This food is already on the list.'),
    ).toBeTruthy()
    expect(screen.getByLabelText('Food')).toBeTruthy()
  })

  it('says when the list is full', async () => {
    jest
      .mocked(apiClient.POST)
      .mockResolvedValue(apiError(409, 'RESTRICTION_LIMIT_REACHED'))
    await renderCard()
    const user = await openForm()

    await user.type(screen.getByLabelText('Food'), 'Mushrooms')
    await press('button', 'Save')

    expect(
      await screen.findByText(
        'The list is full. Remove an item before adding another.',
      ),
    ).toBeTruthy()
  })

  it('does not say that nothing is excluded when the refresh after adding fails', async () => {
    jest.mocked(apiClient.POST).mockResolvedValue(apiResult(201, MUSHROOMS))
    await renderCard([])
    const user = await openForm()
    jest.mocked(apiClient.GET).mockResolvedValue(apiResult(500))

    await user.type(screen.getByLabelText('Food'), 'Mushrooms')
    await press('button', 'Save')

    expect(
      await screen.findByText('We could not load the excluded foods.'),
    ).toBeTruthy()
    expect(screen.queryByText('No foods are excluded.')).toBeNull()
  })

  it('sends one request when the save button is pressed twice', async () => {
    jest.mocked(apiClient.POST).mockReturnValue(new Promise(() => undefined))
    await renderCard()
    const user = await openForm()
    await user.type(screen.getByLabelText('Food'), 'Mushrooms')

    await press('button', 'Save')
    await press('button', 'Save')

    expect(apiClient.POST).toHaveBeenCalledTimes(1)
  })

  it('forgets the typed name and the error on cancel', async () => {
    jest.mocked(apiClient.POST).mockResolvedValue(apiResult(500))
    await renderCard()
    const user = await openForm()
    await user.type(screen.getByLabelText('Food'), 'Mushrooms')
    await press('button', 'Save')
    await screen.findByText(SERVER_ERROR_TEXT)

    await press('button', 'Cancel')
    await press('button', 'Add food')

    expect(screen.queryByText(SERVER_ERROR_TEXT)).toBeNull()
    expect(screen.getByLabelText('Food').props.value).toBe('')
  })
})

describe('ExclusionsCard removing', () => {
  it('asks first and says that the food may appear in plans again', async () => {
    await renderCard([MUSHROOMS])

    await press('button', 'Remove Mushrooms')

    expect(await screen.findByText('Stop excluding Mushrooms?')).toBeTruthy()
    expect(
      screen.getByText('Meal plans for Max may include Mushrooms again.'),
    ).toBeTruthy()
    expect(apiClient.DELETE).not.toHaveBeenCalled()
  })

  it('keeps the exclusion when the question is cancelled', async () => {
    await renderCard([MUSHROOMS])

    await press('button', 'Remove Mushrooms')
    await press('button', 'Cancel')

    expect(apiClient.DELETE).not.toHaveBeenCalled()
    expect(screen.getByText('Mushrooms')).toBeTruthy()
  })

  it('removes the confirmed exclusion and refreshes the list', async () => {
    jest.mocked(apiClient.DELETE).mockResolvedValue(apiResult(204))
    await renderCard([MUSHROOMS, OLIVES])

    await press('button', 'Remove Olives')
    await press('button', 'Stop excluding')

    await waitFor(() =>
      expect(apiClient.DELETE).toHaveBeenCalledWith(
        '/api/v1/people/{id}/exclusions/{exclusionId}',
        { params: { path: { id: 'person-1', exclusionId: 'exclusion-2' } } },
      ),
    )
    await waitFor(() => expect(apiClient.GET).toHaveBeenCalledTimes(2))
  })

  it('refreshes the list even when the exclusion is already gone', async () => {
    jest.mocked(apiClient.DELETE).mockResolvedValue(apiResult(404))
    await renderCard([MUSHROOMS])

    await press('button', 'Remove Mushrooms')
    await press('button', 'Stop excluding')

    await waitFor(() => expect(apiClient.GET).toHaveBeenCalledTimes(2))
  })

  it('shows the error when the removal fails', async () => {
    jest.mocked(apiClient.DELETE).mockResolvedValue(apiResult(500))
    await renderCard([MUSHROOMS])

    await press('button', 'Remove Mushrooms')
    await press('button', 'Stop excluding')

    expect(await screen.findByText(SERVER_ERROR_TEXT)).toBeTruthy()
    expect(screen.getByText('Mushrooms')).toBeTruthy()
  })
})
