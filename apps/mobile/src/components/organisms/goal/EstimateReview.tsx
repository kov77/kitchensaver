import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { View } from 'react-native'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/atoms/Button'
import { Text } from '@/components/atoms/Text'
import { FormTextField } from '@/components/molecules/FormTextField'
import type { EstimatedGoalType, GoalEstimate } from '@/core/types'
import { parseDecimal } from '@/utils/numbers'

import { styles } from './EstimateReview.styles'
import { targetSchema, type TargetValues } from './schemas'
import { getAssumptionKey } from './utils'

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
  const { t } = useTranslation('goal')
  const { estimatedMaintenanceKcal, methodology, assumptions } = estimate
  const { control, handleSubmit } = useForm<TargetValues>({
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
          {t('editor-estimate-title')}
        </Text>
        <Text variant="title">
          {`${estimatedMaintenanceKcal.toLocaleString('en-US')} ${t('editor-maintenance-suffix')}`}
        </Text>
        <Text variant="subtitle" color="textMuted">
          {t('editor-disclaimer')}
        </Text>
        <Text variant="label" color="textMuted">
          {t('editor-assumptions-label')}
        </Text>
        <Text variant="subtitle" color="textMuted">
          {methodology}
        </Text>
        {assumptions.map((assumption) => (
          <Text key={assumption} variant="subtitle" color="textMuted">
            {`• ${t(getAssumptionKey(assumption))}`}
          </Text>
        ))}
      </View>
      {goalType !== 'MAINTAIN' ? (
        <Text variant="subtitle" color="textMuted">
          {t('editor-target-hint')}
        </Text>
      ) : null}
      <FormTextField
        control={control}
        name="dailyKcal"
        label={t('editor-target-label')}
        keyboardType="number-pad"
      />
      <Button
        title={submitLabel}
        isLoading={isSaving}
        onPress={() => void submit()}
      />
      <Button
        title={t('editor-change-details')}
        variant="secondary"
        onPress={onChangeDetails}
      />
    </>
  )
}
