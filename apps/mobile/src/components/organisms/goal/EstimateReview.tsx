import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { View } from 'react-native'

import { Button } from '@/components/atoms/Button'
import { Text } from '@/components/atoms/Text'
import { TextField } from '@/components/molecules/TextField'
import type { EstimatedGoalType, GoalEstimate } from '@/core/types'
import { parseDecimal } from '@/utils/numbers'

import { styles } from './EstimateReview.styles'
import {
  ASSUMPTION_TEXT,
  GOAL_EDITOR_TEXT,
  UNKNOWN_ASSUMPTION_TEXT,
} from './constants'
import { targetSchema, type TargetValues } from './schemas'

type EstimateReviewProps = {
  estimate: GoalEstimate
  goalType: EstimatedGoalType
  submitLabel: string
  isSaving: boolean
  onSubmit: (dailyKcal: number) => void
  onChangeDetails: () => void
}

export function EstimateReview({
  estimate,
  goalType,
  submitLabel,
  isSaving,
  onSubmit,
  onChangeDetails,
}: EstimateReviewProps) {
  const { estimatedMaintenanceKcal, methodology, assumptions } = estimate
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<TargetValues>({
    resolver: zodResolver(targetSchema),
    defaultValues: {
      dailyKcal:
        goalType === 'MAINTAIN' ? String(estimatedMaintenanceKcal) : '',
    },
  })

  const submit = handleSubmit(({ dailyKcal }) => {
    const kcal = parseDecimal(dailyKcal)
    if (kcal !== null) onSubmit(kcal)
  })

  return (
    <>
      <View style={styles.card}>
        <Text variant="label" accessibilityRole="header">
          {GOAL_EDITOR_TEXT.estimateTitle}
        </Text>
        <Text variant="title">
          {`${estimatedMaintenanceKcal.toLocaleString('en-US')} ${GOAL_EDITOR_TEXT.maintenanceSuffix}`}
        </Text>
        <Text variant="subtitle" color="textMuted">
          {GOAL_EDITOR_TEXT.disclaimer}
        </Text>
        <Text variant="label" color="textMuted">
          {GOAL_EDITOR_TEXT.assumptionsLabel}
        </Text>
        <Text variant="subtitle" color="textMuted">
          {methodology}
        </Text>
        {assumptions.map((assumption) => (
          <Text key={assumption} variant="subtitle" color="textMuted">
            {`• ${ASSUMPTION_TEXT[assumption] ?? UNKNOWN_ASSUMPTION_TEXT}`}
          </Text>
        ))}
      </View>
      {goalType !== 'MAINTAIN' ? (
        <Text variant="subtitle" color="textMuted">
          {GOAL_EDITOR_TEXT.targetHint}
        </Text>
      ) : null}
      <Controller
        control={control}
        name="dailyKcal"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label={GOAL_EDITOR_TEXT.targetLabel}
            errorMessage={errors.dailyKcal?.message}
            keyboardType="number-pad"
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
          />
        )}
      />
      <Button
        title={submitLabel}
        isLoading={isSaving}
        onPress={() => void submit()}
      />
      <Button
        title={GOAL_EDITOR_TEXT.changeDetails}
        variant="secondary"
        onPress={onChangeDetails}
      />
    </>
  )
}
