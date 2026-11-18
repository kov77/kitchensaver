import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, userEvent } from '@testing-library/react-native'

import { apiClient } from '@/api/apiClient'
import { ME_QUERY_KEY } from '@/api/constants'
import { ERROR_MESSAGES } from '@/core/constants'

import { ConsentScreen } from './ConsentScreen'
import { CONSENT_TEXT, LEGAL_DOCUMENTS } from './constants'

const mockSignOut = jest.fn()

jest.mock('@/api/apiClient', () => ({
  apiClient: { GET: jest.fn(), POST: jest.fn() },
}))

jest.mock('@/core/auth/SessionProvider', () => ({
  useSession: () => ({ signOut: mockSignOut }),
}))

const PENDING_ME = {
  id: '0f8fad5b-d9cb-469f-a165-70867728950e',
  onboarding: {
    complete: false,
    missing: ['ADULT_ATTESTATION', 'TERMS_OF_SERVICE', 'PRIVACY_POLICY'],
    currentVersions: {
      adultAttestationVersion: 'adult-v9',
      termsVersion: 'terms-v9',
      privacyVersion: 'privacy-v9',
    },
  },
}

const COMPLETE_ONBOARDING = {
  ...PENDING_ME.onboarding,
  complete: true,
  missing: [],
}

let queryClient: QueryClient

function respond(status: number, data?: unknown) {
  return { data, response: new Response(null, { status }) } as never
}

async function renderConsent() {
  await render(
    <QueryClientProvider client={queryClient}>
      <ConsentScreen />
    </QueryClientProvider>,
  )
  await screen.findByRole('button', { name: CONSENT_TEXT.submit })
}

async function checkAll() {
  const user = userEvent.setup()
  await user.press(
    screen.getByRole('checkbox', { name: CONSENT_TEXT.adultLabel }),
  )
  await user.press(
    screen.getByRole('checkbox', { name: CONSENT_TEXT.termsLabel }),
  )
  await user.press(
    screen.getByRole('checkbox', { name: CONSENT_TEXT.privacyLabel }),
  )
}

function pressContinue() {
  return userEvent
    .setup()
    .press(screen.getByRole('button', { name: CONSENT_TEXT.submit }))
}

beforeEach(() => {
  jest.clearAllMocks()
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  jest.mocked(apiClient.GET).mockResolvedValue(respond(200, PENDING_ME))
})

describe('ConsentScreen', () => {
  it('shows both legal texts and three unchecked confirmations', async () => {
    await renderConsent()

    for (const { title } of LEGAL_DOCUMENTS) {
      expect(screen.getByText(title)).toBeTruthy()
    }
    for (const label of [
      CONSENT_TEXT.adultLabel,
      CONSENT_TEXT.termsLabel,
      CONSENT_TEXT.privacyLabel,
    ]) {
      expect(screen.getByRole('checkbox', { name: label })).not.toBeChecked()
    }
  })

  it('does not call the server until every confirmation is checked', async () => {
    await renderConsent()
    await userEvent
      .setup()
      .press(screen.getByRole('checkbox', { name: CONSENT_TEXT.adultLabel }))

    await pressContinue()

    expect(
      await screen.findAllByText(CONSENT_TEXT.confirmationRequired),
    ).toHaveLength(2)
    expect(apiClient.POST).not.toHaveBeenCalled()
  })

  it('sends the confirmations with the versions the server reported', async () => {
    jest
      .mocked(apiClient.POST)
      .mockResolvedValue(respond(200, COMPLETE_ONBOARDING))
    await renderConsent()
    await checkAll()

    await pressContinue()

    expect(apiClient.POST).toHaveBeenCalledWith('/api/v1/me/consents', {
      body: {
        adultConfirmed: true,
        acceptTerms: true,
        acknowledgePrivacy: true,
        termsVersion: 'terms-v9',
        privacyVersion: 'privacy-v9',
      },
    })
  })

  it('stores the new onboarding status so the app can open', async () => {
    jest
      .mocked(apiClient.POST)
      .mockResolvedValue(respond(200, COMPLETE_ONBOARDING))
    await renderConsent()
    await checkAll()

    await pressContinue()

    await screen.findByRole('button', { name: CONSENT_TEXT.submit })
    expect(
      queryClient.getQueryData<typeof PENDING_ME>(ME_QUERY_KEY)?.onboarding
        .complete,
    ).toBe(true)
  })

  it('sends one request when the button is pressed twice quickly', async () => {
    jest.mocked(apiClient.POST).mockReturnValue(new Promise(() => undefined))
    await renderConsent()
    await checkAll()
    const user = userEvent.setup()
    const button = screen.getByRole('button', { name: CONSENT_TEXT.submit })

    await user.press(button)
    await user.press(button)

    expect(apiClient.POST).toHaveBeenCalledTimes(1)
  })

  it('shows a plain message and keeps the choices when the server refuses', async () => {
    jest.mocked(apiClient.POST).mockResolvedValue(respond(422))
    await renderConsent()
    await checkAll()

    await pressContinue()

    expect(await screen.findByText(ERROR_MESSAGES.UNKNOWN)).toBeTruthy()
    expect(
      screen.getByRole('checkbox', { name: CONSENT_TEXT.termsLabel }),
    ).toBeChecked()
  })

  it('lets the user log out', async () => {
    await renderConsent()

    await userEvent
      .setup()
      .press(screen.getByRole('button', { name: CONSENT_TEXT.logOut }))

    expect(mockSignOut).toHaveBeenCalledTimes(1)
  })
})
