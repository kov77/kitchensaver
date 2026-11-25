import { render, screen, userEvent } from '@testing-library/react-native'
import { useForm } from 'react-hook-form'

import { SUBMIT_LABEL, SubmitButton } from '@/test-utils/SubmitButton'

import { FormStepperField } from './FormStepperField'

type Values = { rating: number }

const onSubmit = jest.fn()

function Harness() {
  const { control, handleSubmit } = useForm<Values>({
    defaultValues: { rating: 3 },
  })

  return (
    <>
      <FormStepperField
        control={control}
        name="rating"
        label="Rating (1 to 5)"
        min={1}
        max={5}
        decreaseLabel="Lower the rating"
        increaseLabel="Raise the rating"
      />
      <SubmitButton
        onPress={() => void handleSubmit((values) => onSubmit(values))()}
      />
    </>
  )
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('FormStepperField', () => {
  it('starts at the default value of the form', async () => {
    await render(<Harness />)

    expect(screen.getByText('3')).toBeTruthy()
    expect(screen.getByText('Rating (1 to 5)')).toBeTruthy()
  })

  it('writes the stepped value to the form', async () => {
    await render(<Harness />)
    const user = userEvent.setup()

    await user.press(screen.getByRole('button', { name: 'Raise the rating' }))
    await user.press(screen.getByRole('button', { name: 'Raise the rating' }))
    await user.press(screen.getByRole('button', { name: SUBMIT_LABEL }))

    expect(onSubmit).toHaveBeenCalledWith({ rating: 5 })
  })

  it('stops at the limits', async () => {
    await render(<Harness />)
    const user = userEvent.setup()

    for (let step = 0; step < 4; step += 1) {
      await user.press(screen.getByRole('button', { name: 'Lower the rating' }))
    }
    await user.press(screen.getByRole('button', { name: SUBMIT_LABEL }))

    expect(onSubmit).toHaveBeenCalledWith({ rating: 1 })
  })
})
