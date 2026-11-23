import { onlineManager, useQuery } from '@tanstack/react-query'
import { screen, userEvent, waitFor } from '@testing-library/react-native'
import { Text } from 'react-native'

import {
  createTestQueryClient,
  renderWithQuery,
} from '@/test-utils/renderWithQuery'

import { QueryContent } from './QueryContent'

type Fetcher = () => Promise<string>

function Harness({ fetcher }: { fetcher: Fetcher }) {
  const query = useQuery({ queryKey: ['content'], queryFn: fetcher })

  return (
    <QueryContent
      query={query}
      failureMessage="Could not load"
      retryLabel="Try again"
    >
      {(data) => <Text>{`Loaded ${data}`}</Text>}
    </QueryContent>
  )
}

afterEach(() => {
  onlineManager.setOnline(true)
})

describe('QueryContent', () => {
  it('shows a spinner while the first load is running', async () => {
    await renderWithQuery(
      <Harness fetcher={() => new Promise<string>(() => undefined)} />,
    )

    expect(screen.getByLabelText('Loading')).toBeTruthy()
    expect(screen.queryByText('Could not load')).toBeNull()
  })

  it('gives the loaded data to its children', async () => {
    await renderWithQuery(<Harness fetcher={async () => 'list'} />)

    expect(await screen.findByText('Loaded list')).toBeTruthy()
  })

  it('shows an empty result as data, not as a failure', async () => {
    await renderWithQuery(<Harness fetcher={async () => ''} />)

    expect(await screen.findByText('Loaded')).toBeTruthy()
    expect(screen.queryByText('Could not load')).toBeNull()
  })

  it('shows the failure and loads again on retry', async () => {
    const fetcher = jest
      .fn<Promise<string>, []>()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce('list')
    await renderWithQuery(<Harness fetcher={fetcher} />)

    expect(await screen.findByText('Could not load')).toBeTruthy()

    await userEvent
      .setup()
      .press(screen.getByRole('button', { name: 'Try again' }))

    expect(await screen.findByText('Loaded list')).toBeTruthy()
  })

  it('does not keep showing old data after a refresh failed', async () => {
    const queryClient = createTestQueryClient()
    queryClient.setQueryData(['content'], 'old list')
    const fetcher = jest
      .fn<Promise<string>, []>()
      .mockRejectedValue(new Error('offline'))
    await renderWithQuery(<Harness fetcher={fetcher} />, queryClient)

    await waitFor(() => expect(screen.getByText('Could not load')).toBeTruthy())
    expect(screen.queryByText('Loaded old list')).toBeNull()
  })

  it('says so instead of spinning forever when the device is offline', async () => {
    onlineManager.setOnline(false)
    await renderWithQuery(<Harness fetcher={async () => 'list'} />)

    expect(await screen.findByText('Could not load')).toBeTruthy()
    expect(screen.queryByLabelText('Loading')).toBeNull()
  })
})
