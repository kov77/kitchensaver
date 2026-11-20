import { zodResolver } from '@hookform/resolvers/zod'
import { render, screen, userEvent } from '@testing-library/react-native'
import { useForm } from 'react-hook-form'
import * as zod from 'zod'

import { SUBMIT_LABEL, SubmitButton } from '@/test-utils/SubmitButton'

import { FormChoiceField } from './FormChoiceField'

type Sex = 'MALE' | 'FEMALE'

const OPTIONS = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
] as const

const schema = zod.object({
  sex: zod
    .custom<Sex | null>()
    .refine((value) => value !== null, 'Choose an option.'),
})

type Values = zod.input<typeof schema>

const onSubmit = jest.fn()

function Harness() {
  const { control, handleSubmit } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { sex: null },
  })

  return (
    <>
      <FormChoiceField
        control={control}
        name="sex"
        label="Sex"
        options={OPTIONS}
      />
      <SubmitButton
        onPress={() => void handleSubmit((values) => onSubmit(values))()}
      />
    </>
  )
}

function submit() {
  return userEvent
    .setup()
    .press(screen.getByRole('button', { name: SUBMIT_LABEL }))
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('FormChoiceField', () => {
  it('stores the chosen option and marks it selected', async () => {
    await render(<Harness />)

    await userEvent.setup().press(screen.getByRole('radio', { name: 'Female' }))
    await submit()

    expect(screen.getByRole('radio', { name: 'Female' })).toBeChecked()
    expect(onSubmit).toHaveBeenCalledWith({ sex: 'FEMALE' })
  })

  it('shows the message when nothing was chosen', async () => {
    await render(<Harness />)

    await submit()

    expect(await screen.findByText('Choose an option.')).toBeTruthy()
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
