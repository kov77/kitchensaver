import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, userEvent } from '@testing-library/react-native'

import { ApiRequestError } from '@/utils/errors'
import { ERROR_MESSAGES } from '@/core/constants'
import type { GoalEstimate } from '@/core/types'

import { GoalEditor } from './GoalEditor'
import {
  ACTIVITY_LABELS,
  ASSUMPTION_TEXT,
  GOAL_EDITOR_ERRORS,
  GOAL_EDITOR_TEXT,
  SEX_LABELS,
  UNKNOWN_ASSUMPTION_TEXT,
} from './goal/constants'

const ESTIMATE: GoalEstimate = {
  estimatedMaintenanceKcal: 2275,
  methodology: 'National Academies DRI 2023',
  assumptions: ['MAINTENANCE_ENERGY_NOT_A_TARGET', 'SOME_FUTURE_CODE'],
}

const onEstimate = jest.fn<Promise<GoalEstimate>, [unknown]>()
const onSave = jest.fn()

async function renderEditor(saveErrorMessage: string | null = null) {
  await render(
    <QueryClientProvider client={new QueryClient()}>
      <GoalEditor
        submitLabel="Save goal"
        isSaving={false}
        saveErrorMessage={saveErrorMessage}
        onEstimate={onEstimate}
        onSave={onSave}
      />
    </QueryClientProvider>,
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
  await press('radio', GOAL_EDITOR_TEXT.modeEstimate)
  await press('radio', goalType)
  await user.type(screen.getByLabelText(GOAL_EDITOR_TEXT.heightLabel), height)
  await user.type(screen.getByLabelText(GOAL_EDITOR_TEXT.weightLabel), weight)
  await press('radio', ACTIVITY_LABELS.LOW_ACTIVE)
  await press('radio', SEX_LABELS.FEMALE)
  await press('button', GOAL_EDITOR_TEXT.calculate)
}

beforeEach(() => {
  jest.clearAllMocks()
  onEstimate.mockResolvedValue(ESTIMATE)
})

describe('GoalEditor manual mode', () => {
  beforeEach(async () => {
    await renderEditor()
    await press('radio', GOAL_EDITOR_TEXT.modeManual)
  })

  it('needs a goal type and calories before saving', async () => {
    await press('button', 'Save goal')

    expect(await screen.findByText(GOAL_EDITOR_ERRORS.choose)).toBeTruthy()
    expect(screen.getByText(GOAL_EDITOR_ERRORS.kcal)).toBeTruthy()
    expect(onSave).not.toHaveBeenCalled()
  })

  it.each(['499', '10001', '2000.5', 'lots'])(
    'rejects %s calories',
    async (kcal) => {
      const user = userEvent.setup()
      await press('radio', 'Maintain weight')
      await user.type(screen.getByLabelText(GOAL_EDITOR_TEXT.kcalLabel), kcal)

      await press('button', 'Save goal')

      expect(await screen.findByText(GOAL_EDITOR_ERRORS.kcal)).toBeTruthy()
      expect(onSave).not.toHaveBeenCalled()
    },
  )

  it('saves a manual goal with the chosen type and calories', async () => {
    const user = userEvent.setup()
    await press('radio', 'Custom goal')
    await user.type(screen.getByLabelText(GOAL_EDITOR_TEXT.kcalLabel), '2000')

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

    expect(await screen.findByText(GOAL_EDITOR_ERRORS.height)).toBeTruthy()
    expect(screen.getByText(GOAL_EDITOR_ERRORS.weight)).toBeTruthy()
    expect(onEstimate).not.toHaveBeenCalled()
  })

  it('shows the estimate with its disclaimer and how it was calculated', async () => {
    await renderEditor()

    await fillEstimateInputs()

    expect(await screen.findByText(/2,275/)).toBeTruthy()
    expect(screen.getByText(GOAL_EDITOR_TEXT.disclaimer)).toBeTruthy()
    expect(screen.getByText(ESTIMATE.methodology)).toBeTruthy()
    expect(
      screen.getByText(`• ${ASSUMPTION_TEXT.MAINTENANCE_ENERGY_NOT_A_TARGET}`),
    ).toBeTruthy()
    expect(screen.getByText(`• ${UNKNOWN_ASSUMPTION_TEXT}`)).toBeTruthy()
    expect(screen.queryByText(/MAINTENANCE_ENERGY|SOME_FUTURE_CODE/)).toBeNull()
  })

  it('suggests the maintenance value only for a maintain goal', async () => {
    await renderEditor()

    await fillEstimateInputs({ goalType: 'Maintain weight' })

    expect(
      (await screen.findByLabelText(GOAL_EDITOR_TEXT.targetLabel)).props.value,
    ).toBe('2275')
  })

  it('leaves the target empty for a weight loss goal so the user decides', async () => {
    await renderEditor()

    await fillEstimateInputs({ goalType: 'Lose weight' })

    expect(
      (await screen.findByLabelText(GOAL_EDITOR_TEXT.targetLabel)).props.value,
    ).toBe('')
    expect(screen.getByText(GOAL_EDITOR_TEXT.targetHint)).toBeTruthy()
  })

  it('saves the inputs together with the calories the user confirmed', async () => {
    const user = userEvent.setup()
    await renderEditor()
    await fillEstimateInputs({ goalType: 'Lose weight' })
    await user.type(
      await screen.findByLabelText(GOAL_EDITOR_TEXT.targetLabel),
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
    await screen.findByLabelText(GOAL_EDITOR_TEXT.targetLabel)

    await press('button', 'Save goal')

    expect(await screen.findByText(GOAL_EDITOR_ERRORS.kcal)).toBeTruthy()
    expect(onSave).not.toHaveBeenCalled()
  })

  it('shows a plain message and stays on the form when the estimate fails', async () => {
    onEstimate.mockRejectedValue(new ApiRequestError(503))
    await renderEditor()

    await fillEstimateInputs()

    expect(await screen.findByText(ERROR_MESSAGES.SERVER)).toBeTruthy()
    expect(
      screen.getByRole('button', { name: GOAL_EDITOR_TEXT.calculate }),
    ).toBeTruthy()
    expect(onSave).not.toHaveBeenCalled()
  })

  it('goes back to the details with the values kept', async () => {
    await renderEditor()
    await fillEstimateInputs()
    await screen.findByText(GOAL_EDITOR_TEXT.disclaimer)

    await press('button', GOAL_EDITOR_TEXT.changeDetails)

    expect(
      (await screen.findByLabelText(GOAL_EDITOR_TEXT.heightLabel)).props.value,
    ).toBe('165')
    expect(screen.getByRole('radio', { name: SEX_LABELS.FEMALE })).toBeChecked()
  })

  it('shows an error from the save request', async () => {
    await renderEditor('Could not save.')

    expect(screen.getByText('Could not save.')).toBeTruthy()
  })
})
