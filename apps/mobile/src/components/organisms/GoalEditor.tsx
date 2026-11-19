import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'

import { ChoiceField } from '@/components/molecules/ChoiceField'
import { FormMessage } from '@/components/molecules/FormMessage'
import type { EstimateInput, GoalDraft, GoalEstimate } from '@/core/types'
import { getErrorMessage } from '@/utils/errors'

import { EstimateInputsForm } from './goal/EstimateInputsForm'
import { EstimateReview } from './goal/EstimateReview'
import { ManualGoalForm } from './goal/ManualGoalForm'
import { GOAL_EDITOR_TEXT, GOAL_MODE } from './goal/constants'

type GoalMode = (typeof GOAL_MODE)[keyof typeof GOAL_MODE]

type GoalEditorProps = {
  submitLabel: string
  isSaving: boolean
  saveErrorMessage: string | null
  onEstimate: (input: EstimateInput) => Promise<GoalEstimate>
  onSave: (goal: GoalDraft) => void
}

const MODE_OPTIONS = [
  { value: GOAL_MODE.MANUAL, label: GOAL_EDITOR_TEXT.modeManual },
  { value: GOAL_MODE.ESTIMATED, label: GOAL_EDITOR_TEXT.modeEstimate },
] as const

export function GoalEditor({
  submitLabel,
  isSaving,
  saveErrorMessage,
  onEstimate,
  onSave,
}: GoalEditorProps) {
  const [mode, setMode] = useState<GoalMode | null>(null)
  const [isChangingDetails, setIsChangingDetails] = useState(false)
  const {
    mutate: estimate,
    data: estimateResult,
    variables: estimateInput,
    error: estimateError,
    isPending: isEstimating,
  } = useMutation({
    meta: { skipGlobalError: true },
    mutationFn: (input: EstimateInput) => onEstimate(input),
  })

  const isReviewing = estimateResult && estimateInput && !isChangingDetails

  return (
    <>
      <ChoiceField
        label={GOAL_EDITOR_TEXT.modeLabel}
        options={MODE_OPTIONS}
        value={mode}
        onChange={setMode}
      />
      {mode === GOAL_MODE.MANUAL ? (
        <ManualGoalForm
          submitLabel={submitLabel}
          isSaving={isSaving}
          onSubmit={onSave}
        />
      ) : null}
      {mode === GOAL_MODE.ESTIMATED && !isReviewing ? (
        <EstimateInputsForm
          initialInput={estimateInput ?? null}
          errorMessage={estimateError ? getErrorMessage(estimateError) : null}
          isEstimating={isEstimating}
          onSubmit={(input) => {
            setIsChangingDetails(false)
            estimate(input)
          }}
        />
      ) : null}
      {mode === GOAL_MODE.ESTIMATED && isReviewing ? (
        <EstimateReview
          estimate={estimateResult}
          goalType={estimateInput.goalType}
          submitLabel={submitLabel}
          isSaving={isSaving}
          onSubmit={(dailyKcal) =>
            onSave({ mode: 'ESTIMATED', ...estimateInput, dailyKcal })
          }
          onChangeDetails={() => setIsChangingDetails(true)}
        />
      ) : null}
      {saveErrorMessage ? <FormMessage message={saveErrorMessage} /> : null}
    </>
  )
}
