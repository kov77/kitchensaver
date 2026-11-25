import { screen, userEvent, waitFor } from '@testing-library/react-native'

import { apiClient } from '@/api/apiClient'
import { usePerson } from '@/api/queries/usePerson'
import { getPersonKey } from '@/api/queryKeys'
import type { Allergy, PersonDetail } from '@/api/types'
import { apiError } from '@/test-utils/apiError'
import { apiResult } from '@/test-utils/apiResult'
import {
  createTestQueryClient,
  renderWithQuery,
} from '@/test-utils/renderWithQuery'

import { AllergyCard } from './AllergyCard'

jest.mock('@/api/apiClient', () => ({
  apiClient: {
    GET: jest.fn(),
    POST: jest.fn(),
    PUT: jest.fn(),
    DELETE: jest.fn(),
  },
}))

const PEANUT: Allergy = {
  id: 'allergy-1',
  allergenCode: 'PEANUT',
  customLabel: null,
  resolved: true,
  createdAt: '2026-11-01T10:00:00.000Z',
}

const KIWI: Allergy = {
  id: 'allergy-2',
  allergenCode: 'OTHER',
  customLabel: 'Kiwi',
  resolved: false,
  createdAt: '2026-11-01T10:00:00.000Z',
}

const MILK: Allergy = { ...PEANUT, id: 'allergy-3', allergenCode: 'MILK' }

const SERVER_ERROR_TEXT = 'The server had a problem. Please try again.'
const ADD_FAILED_PATTERN =
  /Some allergies may not have been saved.*server had a problem/

async function renderCard(
  allergyStatus: PersonDetail['allergyStatus'],
  allergies: Allergy[] = [],
) {
  jest.mocked(apiClient.GET).mockResolvedValue(apiResult(200, allergies))
  const queryClient = createTestQueryClient()
  queryClient.setQueryData(getPersonKey('person-1'), { id: 'person-1' })
  await renderWithQuery(
    <AllergyCard
      personId="person-1"
      personName="Max"
      allergyStatus={allergyStatus}
    />,
    queryClient,
  )
  return queryClient
}

async function renderListed(allergies: Allergy[]) {
  const queryClient = await renderCard('HAS_ALLERGIES', allergies)
  await screen.findByRole('button', { name: 'Add allergies' })
  return queryClient
}

function PersonAllergies() {
  const { data: person } = usePerson({ personId: 'person-1' })
  if (!person) return null
  return (
    <AllergyCard
      personId="person-1"
      personName="Max"
      allergyStatus={person.allergyStatus}
    />
  )
}

function press(role: 'button' | 'radio' | 'checkbox', name: string) {
  return userEvent.setup().press(screen.getByRole(role, { name }))
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('AllergyCard answering the question', () => {
  it.each([
    ['No', 'NONE', 'Please double-check'],
    ["I don't know", 'UNKNOWN', 'Plans may not be safe for you'],
  ] as const)(
    'warns before saving the answer %s and saves only after confirmation',
    async (label, status, dialogTitle) => {
      jest
        .mocked(apiClient.PUT)
        .mockResolvedValue(
          apiResult(200, { allergyStatus: status, allergyStatusAt: 'now' }),
        )
      await renderCard(null)

      await press('button', 'Change answer')
      await press('radio', label)
      await press('button', 'Save')

      expect(await screen.findByText(dialogTitle)).toBeTruthy()
      expect(apiClient.PUT).not.toHaveBeenCalled()

      await press('button', 'I understand, continue')

      expect(apiClient.PUT).toHaveBeenCalledWith(
        '/api/v1/people/{id}/allergy-status',
        {
          params: { path: { id: 'person-1' } },
          body: { status, warningAcknowledged: true },
        },
      )
    },
  )

  it('does not save the answer when the warning is declined', async () => {
    await renderCard('UNKNOWN')

    await press('button', 'Change answer')
    await press('radio', 'No')
    await press('button', 'Save')
    await press('button', 'Go back')

    expect(apiClient.PUT).not.toHaveBeenCalled()
  })

  it('asks for an answer before saving', async () => {
    await renderCard(null)

    await press('button', 'Change answer')
    await press('button', 'Save')

    expect(await screen.findByText('This field is required.')).toBeTruthy()
    expect(apiClient.PUT).not.toHaveBeenCalled()
  })

  it('adds the chosen allergies with the custom label for the other one', async () => {
    jest.mocked(apiClient.POST).mockResolvedValue(apiResult(201, PEANUT))
    await renderCard(null)

    await press('button', 'Change answer')
    await press('radio', 'Yes')
    await press('checkbox', 'Peanuts')
    await press('checkbox', 'Other')
    await userEvent
      .setup()
      .type(screen.getByLabelText('Describe the allergy'), 'Kiwi')
    await press('button', 'Save')

    await waitFor(() => expect(apiClient.POST).toHaveBeenCalledTimes(2))
    expect(apiClient.POST).toHaveBeenNthCalledWith(
      1,
      '/api/v1/people/{id}/allergies',
      {
        params: { path: { id: 'person-1' } },
        body: { allergenCode: 'PEANUT' },
      },
    )
    expect(apiClient.POST).toHaveBeenNthCalledWith(
      2,
      '/api/v1/people/{id}/allergies',
      {
        params: { path: { id: 'person-1' } },
        body: { allergenCode: 'OTHER', customLabel: 'Kiwi' },
      },
    )
  })

  it('refreshes the person after the answer is saved', async () => {
    jest
      .mocked(apiClient.PUT)
      .mockResolvedValue(
        apiResult(200, { allergyStatus: 'NONE', allergyStatusAt: 'now' }),
      )
    const queryClient = await renderCard(null)

    await press('button', 'Change answer')
    await press('radio', 'No')
    await press('button', 'Save')
    await press('button', 'I understand, continue')

    await waitFor(() =>
      expect(
        queryClient.getQueryState(getPersonKey('person-1'))?.isInvalidated,
      ).toBe(true),
    )
  })

  it('keeps the form and shows a plain error when nothing could be saved', async () => {
    jest.mocked(apiClient.POST).mockResolvedValue(apiResult(500))
    await renderCard(null)

    await press('button', 'Change answer')
    await press('radio', 'Yes')
    await press('checkbox', 'Peanuts')
    await press('button', 'Save')

    expect(await screen.findByText(SERVER_ERROR_TEXT)).toBeTruthy()
    expect(screen.queryByText(ADD_FAILED_PATTERN)).toBeNull()
    expect(screen.getByRole('button', { name: 'Save' })).toBeTruthy()
  })

  it('shows the conflict when the server says allergies already exist', async () => {
    jest.mocked(apiClient.PUT).mockResolvedValue(apiResult(409))
    await renderCard('NONE')

    await press('button', 'Change answer')
    await press('radio', "I don't know")
    await press('button', 'Save')
    await press('button', 'I understand, continue')

    expect(
      await screen.findByText(
        'This could not be saved right now. Please try again.',
      ),
    ).toBeTruthy()
  })

  it('still lets the answer be changed after a long hidden label', async () => {
    await renderCard(null)

    await press('button', 'Change answer')
    await press('radio', 'Yes')
    await press('checkbox', 'Other')
    await userEvent
      .setup()
      .type(screen.getByLabelText('Describe the allergy'), 'x'.repeat(81))
    await press('radio', 'No')
    await press('button', 'Save')

    expect(await screen.findByText('Please double-check')).toBeTruthy()
  })

  it('says that the allergy is already on the list', async () => {
    jest
      .mocked(apiClient.POST)
      .mockResolvedValue(apiError(409, 'ALLERGY_ALREADY_EXISTS'))
    await renderCard(null)

    await press('button', 'Change answer')
    await press('radio', 'Yes')
    await press('checkbox', 'Peanuts')
    await press('button', 'Save')

    expect(
      await screen.findByText('This allergy is already on the list.'),
    ).toBeTruthy()
  })

  it('tells the person to refresh when allergies already exist', async () => {
    jest
      .mocked(apiClient.PUT)
      .mockResolvedValue(apiError(409, 'ALLERGIES_EXIST'))
    await renderCard('NONE')

    await press('button', 'Change answer')
    await press('radio', "I don't know")
    await press('button', 'Save')
    await press('button', 'I understand, continue')

    expect(
      await screen.findByText(/Refresh the screen and try again/),
    ).toBeTruthy()
  })

  it('keeps the form and shows the error when the server refuses', async () => {
    jest.mocked(apiClient.PUT).mockResolvedValue(apiResult(500))
    await renderCard('NONE')

    await press('button', 'Change answer')
    await press('radio', "I don't know")
    await press('button', 'Save')
    await press('button', 'I understand, continue')

    expect(await screen.findByText(SERVER_ERROR_TEXT)).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Save' })).toBeTruthy()
  })

  it('leaves the answer unchanged on cancel', async () => {
    await renderCard('NONE')

    await press('button', 'Change answer')
    await press('button', 'Cancel')

    expect(screen.getByText('No known allergies.')).toBeTruthy()
    expect(apiClient.PUT).not.toHaveBeenCalled()
  })
})

describe('AllergyCard with listed allergies', () => {
  it('offers only the allergens that are not listed yet, and always Other', async () => {
    await renderListed([PEANUT, KIWI])

    await press('button', 'Add allergies')

    expect(screen.queryByRole('checkbox', { name: 'Peanuts' })).toBeNull()
    expect(screen.getByRole('checkbox', { name: 'Milk' })).toBeTruthy()
    expect(screen.getByRole('checkbox', { name: 'Other' })).toBeTruthy()
    expect(screen.queryByText('Do you have any food allergies?')).toBeNull()
  })

  it('adds an allergy', async () => {
    jest.mocked(apiClient.POST).mockResolvedValue(apiResult(201, MILK))
    await renderListed([PEANUT])

    await press('button', 'Add allergies')
    await press('checkbox', 'Milk')
    await press('button', 'Save')

    await waitFor(() =>
      expect(apiClient.POST).toHaveBeenCalledWith(
        '/api/v1/people/{id}/allergies',
        {
          params: { path: { id: 'person-1' } },
          body: { allergenCode: 'MILK' },
        },
      ),
    )
    await waitFor(() =>
      expect(screen.queryByRole('checkbox', { name: 'Milk' })).toBeNull(),
    )
  })

  it('does not post again what a failed attempt already added', async () => {
    jest
      .mocked(apiClient.POST)
      .mockResolvedValueOnce(apiResult(201, MILK))
      .mockResolvedValueOnce(apiResult(500))
      .mockResolvedValueOnce(apiResult(201, PEANUT))
    await renderListed([KIWI])

    await press('button', 'Add allergies')
    await press('checkbox', 'Milk')
    await press('checkbox', 'Peanuts')
    jest.mocked(apiClient.GET).mockResolvedValue(apiResult(200, [KIWI, MILK]))
    await press('button', 'Save')

    expect(await screen.findByText(ADD_FAILED_PATTERN)).toBeTruthy()

    await press('button', 'Save')

    await waitFor(() => expect(apiClient.POST).toHaveBeenCalledTimes(3))
    expect(apiClient.POST).toHaveBeenNthCalledWith(
      3,
      '/api/v1/people/{id}/allergies',
      {
        params: { path: { id: 'person-1' } },
        body: { allergenCode: 'PEANUT' },
      },
    )
  })

  it('does not post the same other allergy again after a failed attempt', async () => {
    jest
      .mocked(apiClient.POST)
      .mockResolvedValueOnce(apiResult(201, KIWI))
      .mockResolvedValueOnce(apiResult(500))
      .mockResolvedValueOnce(apiResult(201, MILK))
    await renderListed([PEANUT])

    await press('button', 'Add allergies')
    await press('checkbox', 'Other')
    await userEvent
      .setup()
      .type(screen.getByLabelText('Describe the allergy'), ' kiwi ')
    await press('checkbox', 'Milk')
    jest.mocked(apiClient.GET).mockResolvedValue(apiResult(200, [PEANUT, KIWI]))
    await press('button', 'Save')

    expect(await screen.findByText(ADD_FAILED_PATTERN)).toBeTruthy()

    await press('button', 'Save')

    await waitFor(() => expect(apiClient.POST).toHaveBeenCalledTimes(3))
    expect(apiClient.POST).toHaveBeenNthCalledWith(
      3,
      '/api/v1/people/{id}/allergies',
      {
        params: { path: { id: 'person-1' } },
        body: { allergenCode: 'MILK' },
      },
    )
  })

  it('asks before removing an allergy and says what changes', async () => {
    await renderListed([PEANUT, KIWI])

    await press('button', 'Remove Kiwi')

    expect(await screen.findByText('Remove “Kiwi”?')).toBeTruthy()
    expect(
      screen.getByText(
        'This allergy will no longer be taken into account for Max, and meal plans may include this food.',
      ),
    ).toBeTruthy()
    expect(apiClient.DELETE).not.toHaveBeenCalled()
  })

  it('warns that removing the last allergy brings the question back', async () => {
    await renderListed([PEANUT])

    await press('button', 'Remove Peanuts')

    expect(
      await screen.findByText(/last allergy of Max.*answered again/),
    ).toBeTruthy()
  })

  it('removes the confirmed allergy and refreshes the person', async () => {
    jest.mocked(apiClient.DELETE).mockResolvedValue(apiResult(204))
    const queryClient = await renderListed([PEANUT, KIWI])

    await press('button', 'Remove Kiwi')
    await press('button', 'Remove allergy')

    await waitFor(() =>
      expect(apiClient.DELETE).toHaveBeenCalledWith(
        '/api/v1/people/{id}/allergies/{allergyId}',
        { params: { path: { id: 'person-1', allergyId: 'allergy-2' } } },
      ),
    )
    await waitFor(() =>
      expect(
        queryClient.getQueryState(getPersonKey('person-1'))?.isInvalidated,
      ).toBe(true),
    )
  })

  it('does not let a second allergy be removed while the first removal is running', async () => {
    jest.mocked(apiClient.DELETE).mockReturnValue(new Promise(() => undefined))
    await renderListed([PEANUT, KIWI])

    await press('button', 'Remove Kiwi')
    await press('button', 'Remove allergy')
    await userEvent
      .setup()
      .press(screen.getByRole('button', { name: 'Remove Peanuts' }))

    expect(screen.queryByText('Remove “Peanuts”?')).toBeNull()
    expect(apiClient.DELETE).toHaveBeenCalledTimes(1)
  })

  it('refreshes the person even when the allergy is already gone on the server', async () => {
    jest.mocked(apiClient.DELETE).mockResolvedValue(apiResult(404))
    const queryClient = await renderListed([PEANUT, KIWI])

    await press('button', 'Remove Kiwi')
    await press('button', 'Remove allergy')

    await waitFor(() =>
      expect(
        queryClient.getQueryState(getPersonKey('person-1'))?.isInvalidated,
      ).toBe(true),
    )
  })

  it('keeps the allergy when the removal is cancelled', async () => {
    await renderListed([PEANUT, KIWI])

    await press('button', 'Remove Kiwi')
    await press('button', 'Cancel')

    expect(apiClient.DELETE).not.toHaveBeenCalled()
  })

  it('shows the error when the removal fails', async () => {
    jest.mocked(apiClient.DELETE).mockResolvedValue(apiResult(500))
    await renderListed([PEANUT, KIWI])

    await press('button', 'Remove Kiwi')
    await press('button', 'Remove allergy')

    expect(await screen.findByText(SERVER_ERROR_TEXT)).toBeTruthy()
    expect(screen.getByText('Kiwi')).toBeTruthy()
  })

  it('shows every listed allergy with its own remove button', async () => {
    await renderListed([PEANUT, KIWI])

    expect(await screen.findByText('Peanuts')).toBeTruthy()
    expect(screen.getByText('Kiwi')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Remove Peanuts' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Remove Kiwi' })).toBeTruthy()
  })
})

describe('AllergyCard when the first allergy is saved and the next one fails', () => {
  it('keeps telling that an allergy may be missing after the card shows the list', async () => {
    let allergyStatus: PersonDetail['allergyStatus'] = null
    jest
      .mocked(apiClient.GET)
      .mockImplementation(async (path: string) =>
        path === '/api/v1/people/{id}/allergies'
          ? apiResult(200, [PEANUT])
          : apiResult(200, { id: 'person-1', allergyStatus }),
      )
    jest.mocked(apiClient.POST).mockImplementation(async () => {
      if (allergyStatus === null) {
        allergyStatus = 'HAS_ALLERGIES'
        return apiResult(201, PEANUT)
      }
      return apiResult(500)
    })
    await renderWithQuery(<PersonAllergies />)
    await screen.findByRole('button', { name: 'Change answer' })

    await press('button', 'Change answer')
    await press('radio', 'Yes')
    await press('checkbox', 'Peanuts')
    await press('checkbox', 'Milk')
    await press('button', 'Save')

    expect(await screen.findByText(ADD_FAILED_PATTERN)).toBeTruthy()
    expect(await screen.findByText('Peanuts')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Add allergies' })).toBeTruthy()
  })
})

describe('AllergyCard after the list is emptied', () => {
  it('drops the add failure together with the list and does not show it again', async () => {
    let allergyStatus: PersonDetail['allergyStatus'] = 'HAS_ALLERGIES'
    jest
      .mocked(apiClient.GET)
      .mockImplementation(async (path: string) =>
        path === '/api/v1/people/{id}/allergies'
          ? apiResult(200, [PEANUT])
          : apiResult(200, { id: 'person-1', allergyStatus }),
      )
    jest.mocked(apiClient.POST).mockResolvedValue(apiResult(500))
    jest.mocked(apiClient.DELETE).mockImplementation(async () => {
      allergyStatus = null
      return apiResult(204)
    })
    await renderWithQuery(<PersonAllergies />)
    await screen.findByRole('button', { name: 'Add allergies' })

    await press('button', 'Add allergies')
    await press('checkbox', 'Milk')
    await press('button', 'Save')
    await screen.findByText(ADD_FAILED_PATTERN)
    await press('button', 'Remove Peanuts')
    await press('button', 'Remove allergy')

    expect(await screen.findByText('Not answered yet.')).toBeTruthy()
    expect(screen.queryByText(ADD_FAILED_PATTERN)).toBeNull()

    await press('button', 'Change answer')

    expect(screen.queryByText(SERVER_ERROR_TEXT)).toBeNull()
  })
})
