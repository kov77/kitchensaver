import { zodResolver } from '@hookform/resolvers/zod'
import { render, screen, userEvent } from '@testing-library/react-native'
import { useForm } from 'react-hook-form'
import * as zod from 'zod'

import { SUBMIT_LABEL, SubmitButton } from '@/test-utils/SubmitButton'

import { FormCheckbox } from './FormCheckbox'

const schema = zod.object({
  accepted: zod.boolean().refine((isChecked) => isChecked, 'Please confirm.'),
})

type Values = zod.infer<typeof schema>

const onSubmit = jest.fn()

function Harness() {
  const { control, handleSubmit } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { accepted: false },
  })

  return (
    <>
      <FormCheckbox control={control} name="accepted" label="I accept" />
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

describe('FormCheckbox', () => {
  it('starts unchecked and stores the choice', async () => {
    await render(<Harness />)
    expect(screen.getByRole('checkbox', { name: 'I accept' })).not.toBeChecked()

    await userEvent
      .setup()
      .press(screen.getByRole('checkbox', { name: 'I accept' }))
    await submit()

    expect(screen.getByRole('checkbox', { name: 'I accept' })).toBeChecked()
    expect(onSubmit).toHaveBeenCalledWith({ accepted: true })
  })

  it('shows its message and does not submit while unchecked', async () => {
    await render(<Harness />)

    await submit()

    expect(await screen.findByText('Please confirm.')).toBeTruthy()
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
