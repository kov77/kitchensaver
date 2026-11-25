import { render, screen } from '@testing-library/react-native'
import type { ReactNode } from 'react'

import { RootNavigator } from './RootNavigator'

jest.mock('expo-router', () => {
  const { Text: MockText } = jest.requireActual('react-native')
  const Stack = ({ children }: { children: ReactNode }) => children
  Stack.Protected = ({
    guard,
    children,
  }: {
    guard: boolean
    children: ReactNode
  }) => (guard ? children : null)
  Stack.Screen = ({ name }: { name: string }) => <MockText>{name}</MockText>
  return { Stack }
})

const ALL_SCREENS = [
  'index',
  'add-person',
  'person/[personId]',
  'goal/[personId]',
  'consent',
  'onboarding',
  'sign-in',
  'sign-up',
]

function renderedScreens() {
  return ALL_SCREENS.filter((name) => screen.queryByText(name) !== null)
}

describe('RootNavigator', () => {
  it('shows only the signed-out screens to a signed-out user', async () => {
    await render(<RootNavigator access="signedOut" />)

    expect(renderedScreens()).toEqual(['sign-in', 'sign-up'])
  })

  it('shows only the consent screen until the confirmations are recorded', async () => {
    await render(<RootNavigator access="consentRequired" />)

    expect(renderedScreens()).toEqual(['consent'])
  })

  it('shows only the onboarding until the account has a profile', async () => {
    await render(<RootNavigator access="onboardingRequired" />)

    expect(renderedScreens()).toEqual(['onboarding'])
  })

  it('opens the app once the confirmations are recorded', async () => {
    await render(<RootNavigator access="ready" />)

    expect(renderedScreens()).toEqual([
      'index',
      'add-person',
      'person/[personId]',
      'goal/[personId]',
    ])
  })

  it('shows no screen while the status is loading', async () => {
    await render(<RootNavigator access="loading" />)

    expect(renderedScreens()).toEqual([])
  })
})
