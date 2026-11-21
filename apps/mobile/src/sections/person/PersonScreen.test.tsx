import { screen, userEvent } from '@testing-library/react-native'

import { apiClient } from '@/api/apiClient'
import type { Allergy, PersonDetail } from '@/api/types'
import {
  PROFILE_ERRORS,
  PROFILE_TEXT,
} from '@/components/organisms/profile/constants'
import { ERROR_MESSAGES, PERSON_SUMMARY_TEXT } from '@/core/constants'
import { apiResult } from '@/test-utils/apiResult'
import { renderWithQuery } from '@/test-utils/renderWithQuery'

import { ALLERGY_STATUS_TEXT, PERSON_TEXT } from './constants'
import { PersonScreen } from './PersonScreen'

const mockBack = jest.fn()
const mockPush = jest.fn()

jest.mock('@/api/apiClient', () => ({
  apiClient: { GET: jest.fn(), PATCH: jest.fn() },
}))

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ personId: 'person-1' }),
  useRouter: () => ({ back: mockBack, push: mockPush }),
}))

type ApiResult = ReturnType<typeof apiResult>

const PERSON: PersonDetail = {
  id: 'person-1',
  name: 'Max',
  age: 34,
  dateOfBirth: '1992-03-04',
  goal: { mode: 'MANUAL', goalType: 'LOSE', dailyKcal: 2100 },
  planReadiness: { ready: true, reasons: [] },
  archivedAt: null,
  allergyStatus: 'NONE',
  allergyStatusAt: '2026-11-01T10:00:00.000Z',
  capabilities: { goalEstimation: true },
  createdAt: '2026-11-01T10:00:00.000Z',
}

const PEANUT_ALLERGY: Allergy = {
  id: 'allergy-1',
  allergenCode: 'PEANUT',
  customLabel: null,
  resolved: true,
  createdAt: '2026-11-01T10:00:00.000Z',
}

const KIWI_ALLERGY: Allergy = {
  id: 'allergy-2',
  allergenCode: 'OTHER',
  customLabel: 'Kiwi',
  resolved: false,
  createdAt: '2026-11-01T10:00:00.000Z',
}

function respondWith({
  person = apiResult(200, PERSON),
  allergies = apiResult(200, []),
}: { person?: ApiResult; allergies?: ApiResult } = {}) {
  jest
    .mocked(apiClient.GET)
    .mockImplementation(async (path: string) =>
      path === '/api/v1/people/{id}/allergies' ? allergies : person,
    )
}

async function renderPerson() {
  await renderWithQuery(<PersonScreen />)
}

beforeEach(() => {
  jest.clearAllMocks()
  respondWith()
})

describe('PersonScreen', () => {
  it('shows the name, age, birth date and goal of the person', async () => {
    await renderPerson()

    expect(await screen.findByRole('header', { name: 'Max' })).toBeTruthy()
    expect(screen.getByText(`34 ${PERSON_TEXT.yearsOld}`)).toBeTruthy()
    expect(screen.getByText('4 March 1992')).toBeTruthy()
    expect(screen.getByText('Lose weight · 2,100 kcal/day')).toBeTruthy()
  })

  it('asks the server for the person in the route', async () => {
    await renderPerson()
    await screen.findByRole('header', { name: 'Max' })

    expect(apiClient.GET).toHaveBeenCalledWith('/api/v1/people/{id}', {
      params: { path: { id: 'person-1' } },
    })
  })

  it('tells what is missing before the person can be planned for', async () => {
    respondWith({
      person: apiResult(200, {
        ...PERSON,
        goal: null,
        planReadiness: { ready: false, reasons: ['MISSING_GOAL'] },
      }),
    })
    await renderPerson()

    expect(
      await screen.findByText(
        `${PERSON_SUMMARY_TEXT.notReady}: add a daily calorie goal`,
      ),
    ).toBeTruthy()
    expect(screen.getByText(PERSON_SUMMARY_TEXT.noGoal)).toBeTruthy()
    expect(
      screen.getByRole('button', { name: PERSON_TEXT.setGoal }),
    ).toBeTruthy()
  })

  it('opens the goal screen for this person', async () => {
    await renderPerson()

    await userEvent
      .setup()
      .press(
        await screen.findByRole('button', { name: PERSON_TEXT.changeGoal }),
      )

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/goal/[personId]',
      params: { personId: 'person-1' },
    })
  })

  it('goes back', async () => {
    await renderPerson()
    await screen.findByRole('header', { name: 'Max' })

    await userEvent
      .setup()
      .press(screen.getByRole('button', { name: PERSON_TEXT.back }))

    expect(mockBack).toHaveBeenCalledTimes(1)
  })

  it('shows a message and retries when the person cannot be loaded', async () => {
    respondWith({ person: apiResult(500) })
    await renderPerson()

    expect(await screen.findByText(ERROR_MESSAGES.SERVER)).toBeTruthy()

    respondWith()
    await userEvent
      .setup()
      .press(screen.getByRole('button', { name: PERSON_TEXT.retry }))

    expect(await screen.findByRole('header', { name: 'Max' })).toBeTruthy()
  })
})

describe('PersonScreen allergies', () => {
  it.each([
    ['NONE', ALLERGY_STATUS_TEXT.NONE],
    ['UNKNOWN', ALLERGY_STATUS_TEXT.UNKNOWN],
    [null, ALLERGY_STATUS_TEXT.NOT_ANSWERED],
  ] as const)('explains the allergy status %s', async (status, text) => {
    respondWith({
      person: apiResult(200, { ...PERSON, allergyStatus: status }),
    })
    await renderPerson()

    expect(await screen.findByText(text)).toBeTruthy()
    expect(apiClient.GET).not.toHaveBeenCalledWith(
      '/api/v1/people/{id}/allergies',
      expect.anything(),
    )
  })

  it('lists the allergies with the custom label for other allergens', async () => {
    respondWith({
      person: apiResult(200, {
        ...PERSON,
        allergyStatus: 'HAS_ALLERGIES',
      }),
      allergies: apiResult(200, [PEANUT_ALLERGY, KIWI_ALLERGY]),
    })
    await renderPerson()

    expect(await screen.findByText('Peanuts')).toBeTruthy()
    expect(screen.getByText('Kiwi')).toBeTruthy()
    expect(screen.queryByText('Other')).toBeNull()
  })

  it('does not show an empty list when the server says there are allergies', async () => {
    respondWith({
      person: apiResult(200, { ...PERSON, allergyStatus: 'HAS_ALLERGIES' }),
      allergies: apiResult(200, []),
    })
    await renderPerson()

    expect(await screen.findByText(PERSON_TEXT.allergyLoadFailed)).toBeTruthy()
    expect(screen.getByRole('button', { name: PERSON_TEXT.retry })).toBeTruthy()
  })

  it('does not show a list as empty when the allergies fail to load', async () => {
    respondWith({
      person: apiResult(200, {
        ...PERSON,
        allergyStatus: 'HAS_ALLERGIES',
      }),
      allergies: apiResult(500),
    })
    await renderPerson()

    expect(await screen.findByText(PERSON_TEXT.allergyLoadFailed)).toBeTruthy()
  })
})

describe('PersonScreen profile editing', () => {
  async function startEditing() {
    const user = userEvent.setup()
    await user.press(
      await screen.findByRole('button', { name: PERSON_TEXT.edit }),
    )
    return user
  }

  it('saves the new name together with the unchanged birth date', async () => {
    jest
      .mocked(apiClient.PATCH)
      .mockResolvedValue(apiResult(200, { ...PERSON, name: 'Maxim' }))
    await renderPerson()
    const user = await startEditing()

    await user.clear(screen.getByLabelText(PROFILE_TEXT.nameLabel))
    await user.type(screen.getByLabelText(PROFILE_TEXT.nameLabel), 'Maxim')
    await user.press(screen.getByRole('button', { name: PERSON_TEXT.save }))

    expect(apiClient.PATCH).toHaveBeenCalledWith('/api/v1/people/{id}', {
      params: { path: { id: 'person-1' } },
      body: { name: 'Maxim', dateOfBirth: '1992-03-04' },
    })
    expect(await screen.findByRole('header', { name: 'Maxim' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: PERSON_TEXT.save })).toBeNull()
  })

  it('does not send an empty name', async () => {
    await renderPerson()
    const user = await startEditing()

    await user.clear(screen.getByLabelText(PROFILE_TEXT.nameLabel))
    await user.press(screen.getByRole('button', { name: PERSON_TEXT.save }))

    expect(await screen.findByText(PROFILE_ERRORS.nameRequired)).toBeTruthy()
    expect(apiClient.PATCH).not.toHaveBeenCalled()
  })

  it('keeps the form open and shows the error when the server refuses', async () => {
    jest.mocked(apiClient.PATCH).mockResolvedValue(apiResult(422))
    await renderPerson()
    const user = await startEditing()

    await user.press(screen.getByRole('button', { name: PERSON_TEXT.save }))

    expect(await screen.findByText(ERROR_MESSAGES.UNPROCESSABLE)).toBeTruthy()
    expect(screen.getByRole('button', { name: PERSON_TEXT.save })).toBeTruthy()
  })

  it('discards the changes on cancel', async () => {
    await renderPerson()
    const user = await startEditing()

    await user.clear(screen.getByLabelText(PROFILE_TEXT.nameLabel))
    await user.type(
      screen.getByLabelText(PROFILE_TEXT.nameLabel),
      'Someone else',
    )
    await user.press(screen.getByRole('button', { name: PERSON_TEXT.cancel }))

    expect(apiClient.PATCH).not.toHaveBeenCalled()
    expect(screen.queryByLabelText(PROFILE_TEXT.nameLabel)).toBeNull()
    expect(screen.getAllByText('Max')).toHaveLength(2)
    expect(screen.queryByText('Someone else')).toBeNull()
  })
})
