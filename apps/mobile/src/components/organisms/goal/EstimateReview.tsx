import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { View } from 'react-native'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/atoms/Button'
import { Text } from '@/components/atoms/Text'
import { ChoiceField } from '@/components/molecules/ChoiceField'
import { FormTextField } from '@/components/molecules/FormTextField'
import type { EstimatedGoalType, GoalEstimate, GoalPace } from '@/core/types'
import { parseDecimal } from '@/utils/numbers'
import { toOptions } from '@/utils/options'

import { styles } from './EstimateReview.styles'
import { targetSchema, type TargetValues } from './schemas'
import { PACE_LABEL_KEYS } from './constants'
import { formatSignedKcal, getAssumptionKey } from './utils'

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
  const {
    estimatedMaintenanceKcal,
    methodology,
    assumptions,
    kcalSuggestions,
  } = estimate
  const [pace, setPace] = useState<GoalPace | null>(null)
  const suggestions = goalType === 'MAINTAIN' ? [] : kcalSuggestions
  const selectedSuggestion = suggestions.find(
    (suggestion) => suggestion.pace === pace,
  )
  const { control, handleSubmit, setValue } = useForm<TargetValues>({
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

  const choosePace = (nextPace: GoalPace) => {
    setPace(nextPace)
    const chosen = suggestions.find(({ pace: option }) => option === nextPace)
    if (chosen) setValue('dailyKcal', String(chosen.suggestedKcal))
  }

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
      {suggestions.length > 0 ? (
        <>
          <Text variant="subtitle" color="textMuted">
            {t('editor-pace-hint')}
          </Text>
          <ChoiceField
            label={t('editor-pace-label')}
            options={toOptions(
              suggestions.map(({ pace: option }) => option),
              (option) => t(PACE_LABEL_KEYS[option]),
            )}
            value={pace}
            onChange={choosePace}
          />
        </>
      ) : null}
      {suggestions.length === 0 && goalType !== 'MAINTAIN' ? (
        <Text variant="subtitle" color="textMuted">
          {t('editor-target-hint')}
        </Text>
      ) : null}
      {selectedSuggestion ? (
        <Text variant="subtitle" color="textMuted">
          {t('editor-pace-calculation', {
            maintenance: estimatedMaintenanceKcal.toLocaleString('en-US'),
            adjustment: formatSignedKcal(selectedSuggestion.adjustmentKcal),
            result: selectedSuggestion.suggestedKcal.toLocaleString('en-US'),
          })}
          {selectedSuggestion.isLimited ? ` ${t('editor-pace-limited')}` : ''}
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
