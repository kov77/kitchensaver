import { render, screen } from '@testing-library/react-native'

import IndexScreen from '../../src/app/index'

describe('IndexScreen', () => {
  it('shows the app name as a header', async () => {
    await render(<IndexScreen />)

    expect(screen.getByRole('header', { name: 'KitchenSaver' })).toBeTruthy()
  })
})
