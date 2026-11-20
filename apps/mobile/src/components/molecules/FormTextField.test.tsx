import { zodResolver } from '@hookform/resolvers/zod'
import { render, screen, userEvent } from '@testing-library/react-native'
import { useForm } from 'react-hook-form'
import * as zod from 'zod'

import { SUBMIT_LABEL, SubmitButton } from '@/test-utils/SubmitButton'

import { FormTextField } from './FormTextField'

const schema = zod.object({ email: zod.string().min(3, 'Too short.') })

type Values = zod.infer<typeof schema>

const onSubmit = jest.fn()

function Harness() {
  const { control, handleSubmit } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  })

  return (
    <>
      <FormTextField
        control={control}
        name="email"
        label="Email"
        keyboardType="email-address"
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

describe('FormTextField', () => {
  it('writes what the user types into the form', async () => {
    await render(<Harness />)

    await userEvent.setup().type(screen.getByLabelText('Email'), 'a@b.c')
    await submit()

    expect(onSubmit).toHaveBeenCalledWith({ email: 'a@b.c' })
  })

  it('shows the validation message of its own field', async () => {
    await render(<Harness />)

    await submit()

    expect(await screen.findByText('Too short.')).toBeTruthy()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('passes input options through to the field', async () => {
    await render(<Harness />)

    expect(screen.getByLabelText('Email').props.keyboardType).toBe(
      'email-address',
    )
  })
})
