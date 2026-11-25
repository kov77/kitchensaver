import { render, screen } from '@testing-library/react-native'
import { Text } from 'react-native'

import { colors } from '@/theme/colors'

import { Highlight } from './Highlight'

describe('Highlight', () => {
  it('colours its text', async () => {
    await render(
      <Text>
        Remove <Highlight>Kiwi</Highlight>?
      </Text>,
    )

    expect(screen.getByText('Kiwi').props.style).toEqual(
      expect.arrayContaining([{ color: colors.danger }]),
    )
  })

  it('stays part of the sentence', async () => {
    await render(
      <Text>
        Remove <Highlight>Kiwi</Highlight>?
      </Text>,
    )

    expect(screen.getByText('Remove Kiwi?')).toBeTruthy()
  })
})
