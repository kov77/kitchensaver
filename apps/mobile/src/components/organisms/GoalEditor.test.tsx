import { screen, userEvent } from '@testing-library/react-native'

import { ApiRequestError } from '@/utils/errors'
import type { GoalEstimate } from '@/core/types'
import { renderWithQuery } from '@/test-utils/renderWithQuery'

import { GoalEditor } from './GoalEditor'

const ESTIMATE: GoalEstimate = {
  estimatedMaintenanceKcal: 2275,
  methodology: 'National Academies DRI 2023',
  assumptions: ['MAINTENANCE_ENERGY_NOT_A_TARGET', 'SOME_FUTURE_CODE'],
}

const onEstimate = jest.fn<Promise<GoalEstimate>, [unknown]>()
const onSave = jest.fn()

async function renderEditor(saveErrorMessage: string | null = null) {
  await renderWithQuery(
    <GoalEditor
      savedParameters={null}
      submitLabel="Save goal"
      isSaving={false}
      saveErrorMessage={saveErrorMessage}
      onEstimate={onEstimate}
      onSave={onSave}
    />,
  )
}

function press(role: 'radio' | 'button', name: string) {
  return userEvent.setup().press(screen.getByRole(role, { name }))
}

async function fillEstimateInputs({
  goalType = 'Maintain weight',
  height = '165',
  weight = '63',
} = {}) {
  const user = userEvent.setup()
  await press('radio', 'Help me estimate')
  await press('radio', goalType)
  await user.type(screen.getByLabelText('Height (cm)'), height)
  await user.type(screen.getByLabelText('Weight (kg)'), weight)
  await press('radio', 'Low active')
  await press('radio', 'Female')
  await press('button', 'Calculate estimate')
}

beforeEach(() => {
  jest.clearAllMocks()
  onEstimate.mockResolvedValue(ESTIMATE)
})

describe('GoalEditor manual mode', () => {
  beforeEach(async () => {
    await renderEditor()
    await press('radio', 'I already know my daily calories')
  })

  it('needs a goal type and calories before saving', async () => {
    await press('button', 'Save goal')

    expect(await screen.findByText('Choose an option.')).toBeTruthy()
    expect(
      screen.getByText('Enter whole calories between 500 and 10,000.'),
    ).toBeTruthy()
    expect(onSave).not.toHaveBeenCalled()
  })

  it.each(['499', '10001', '2000.5', 'lots'])(
    'rejects %s calories',
    async (kcal) => {
      const user = userEvent.setup()
      await press('radio', 'Maintain weight')
      await user.type(screen.getByLabelText('Daily calories (kcal)'), kcal)

      await press('button', 'Save goal')

      expect(
        await screen.findByText('Enter whole calories between 500 and 10,000.'),
      ).toBeTruthy()
      expect(onSave).not.toHaveBeenCalled()
    },
  )

  it('saves a manual goal with the chosen type and calories', async () => {
    const user = userEvent.setup()
    await press('radio', 'Custom goal')
    await user.type(screen.getByLabelText('Daily calories (kcal)'), '2000')

    await press('button', 'Save goal')

    expect(onSave).toHaveBeenCalledWith({
      mode: 'MANUAL',
      goalType: 'CUSTOM',
      dailyKcal: 2000,
    })
  })
})

describe('GoalEditor estimate mode', () => {
  it('asks the server with numbers, accepting a decimal comma', async () => {
    await renderEditor()

    await fillEstimateInputs({ height: '165', weight: '63,5' })

    expect(onEstimate).toHaveBeenCalledWith({
      goalType: 'MAINTAIN',
      heightCm: 165,
      weightKg: 63.5,
      activityLevel: 'LOW_ACTIVE',
      formulaSex: 'FEMALE',
    })
  })

  it('does not ask the server for values outside the allowed range', async () => {
    await renderEditor()

    await fillEstimateInputs({ height: '50', weight: '500' })

    expect(
      await screen.findByText('Enter a height between 90 and 250 cm.'),
    ).toBeTruthy()
    expect(
      screen.getByText('Enter a weight between 20 and 400 kg.'),
    ).toBeTruthy()
    expect(onEstimate).not.toHaveBeenCalled()
  })

  it('shows the estimate with its disclaimer and how it was calculated', async () => {
    await renderEditor()

    await fillEstimateInputs()

    expect(await screen.findByText(/2,275/)).toBeTruthy()
    expect(
      screen.getByText(
        'This is an estimate for information only. It is not medical advice.',
      ),
    ).toBeTruthy()
    expect(screen.getByText(ESTIMATE.methodology)).toBeTruthy()
    expect(
      screen.getByText(
        `• This is the energy to keep your weight, not a weight loss or weight gain target.`,
      ),
    ).toBeTruthy()
    expect(
      screen.getByText(`• Other assumptions of the method apply.`),
    ).toBeTruthy()
    expect(screen.queryByText(/MAINTENANCE_ENERGY|SOME_FUTURE_CODE/)).toBeNull()
  })

  it('suggests the maintenance value only for a maintain goal', async () => {
    await renderEditor()

    await fillEstimateInputs({ goalType: 'Maintain weight' })

    expect(
      (await screen.findByLabelText('Your daily calorie goal (kcal)')).props
        .value,
    ).toBe('2275')
  })

  it('leaves the target empty for a weight loss goal so the user decides', async () => {
    await renderEditor()

    await fillEstimateInputs({ goalType: 'Lose weight' })

    expect(
      (await screen.findByLabelText('Your daily calorie goal (kcal)')).props
        .value,
    ).toBe('')
    expect(
      screen.getByText(
        'The estimate is for keeping your weight. Enter the target you want.',
      ),
    ).toBeTruthy()
  })

  it('saves the inputs together with the calories the user confirmed', async () => {
    const user = userEvent.setup()
    await renderEditor()
    await fillEstimateInputs({ goalType: 'Lose weight' })
    await user.type(
      await screen.findByLabelText('Your daily calorie goal (kcal)'),
      '1900',
    )

    await press('button', 'Save goal')

    expect(onSave).toHaveBeenCalledWith({
      mode: 'ESTIMATED',
      goalType: 'LOSE',
      heightCm: 165,
      weightKg: 63,
      activityLevel: 'LOW_ACTIVE',
      formulaSex: 'FEMALE',
      dailyKcal: 1900,
    })
  })

  it('does not save a weight loss goal until calories are entered', async () => {
    await renderEditor()
    await fillEstimateInputs({ goalType: 'Lose weight' })
    await screen.findByLabelText('Your daily calorie goal (kcal)')

    await press('button', 'Save goal')

    expect(
      await screen.findByText('Enter whole calories between 500 and 10,000.'),
    ).toBeTruthy()
    expect(onSave).not.toHaveBeenCalled()
  })

  it('shows a plain message and stays on the form when the estimate fails', async () => {
    onEstimate.mockRejectedValue(new ApiRequestError(503))
    await renderEditor()

    await fillEstimateInputs()

    expect(
      await screen.findByText('The server had a problem. Please try again.'),
    ).toBeTruthy()
    expect(
      screen.getByRole('button', { name: 'Calculate estimate' }),
    ).toBeTruthy()
    expect(onSave).not.toHaveBeenCalled()
  })

  it('goes back to the details with the values kept', async () => {
    await renderEditor()
    await fillEstimateInputs()
    await screen.findByText(
      'This is an estimate for information only. It is not medical advice.',
    )

    await press('button', 'Change details')

    expect((await screen.findByLabelText('Height (cm)')).props.value).toBe(
      '165',
    )
    expect(screen.getByRole('radio', { name: 'Female' })).toBeChecked()
  })

  it('shows an error from the save request', async () => {
    await renderEditor('Could not save.')

    expect(screen.getByText('Could not save.')).toBeTruthy()
  })
})
