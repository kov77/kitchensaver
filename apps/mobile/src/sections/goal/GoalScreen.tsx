import { useLocalSearchParams, useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'

import { requestGoalEstimate } from '@/api/goalRequests'
import { useBodyParameters } from '@/api/queries/useBodyParameters'
import { useSaveGoal } from '@/api/queries/useSaveGoal'
import { Button } from '@/components/atoms/Button'
import { Spinner } from '@/components/atoms/Spinner'
import { Text } from '@/components/atoms/Text'
import { ScreenHeader } from '@/components/molecules/ScreenHeader'
import { GoalEditor } from '@/components/organisms/GoalEditor'
import { KcalWarningDialog } from '@/components/organisms/goal/KcalWarningDialog'
import { AppScreen } from '@/components/templates/AppScreen'
import type { GoalDraft } from '@/core/types'
import { getErrorMessage, isKcalWarningError } from '@/utils/errors'
import { useOpen } from '@/utils/useOpen'

export function GoalScreen() {
  const { t } = useTranslation('goal')
  const { personId } = useLocalSearchParams<{ personId: string }>()
  const router = useRouter()
  const {
    mutate: saveGoal,
    error,
    isPending,
    variables: attemptedGoal,
    reset: resetSave,
  } = useSaveGoal(personId)
  const {
    data: savedParameters,
    isPending: isParametersPending,
    fetchStatus,
  } = useBodyParameters(personId)
  const [isEditorShown, { open: markEditorShown }] = useOpen()
  const isLoadingParameters = isParametersPending && fetchStatus === 'fetching'
  const isEditorVisible = isEditorShown || !isLoadingParameters
  const arePrefillUnavailable =
    savedParameters === undefined && !isLoadingParameters

  if (isEditorVisible && !isEditorShown) markEditorShown()

  const save = (draft: GoalDraft) =>
    saveGoal(draft, { onSuccess: () => router.back() })
  const isKcalConfirmationNeeded = isKcalWarningError(error)

  return (
    <AppScreen>
      <ScreenHeader title={t('screen-title')} subtitle={t('screen-subtitle')} />
      {arePrefillUnavailable ? (
        <Text variant="body" color="textMuted">
          {t('screen-parameters-unavailable')}
        </Text>
      ) : null}
      {isEditorVisible ? (
        <GoalEditor
          savedParameters={savedParameters ?? null}
          submitLabel={t('screen-save')}
          isSaving={isPending}
          saveErrorMessage={
            error && !isKcalConfirmationNeeded ? getErrorMessage(error) : null
          }
          onEstimate={(input) => requestGoalEstimate(personId, input)}
          onSave={save}
        />
      ) : (
        <Spinner />
      )}
      {isKcalConfirmationNeeded && attemptedGoal ? (
        <KcalWarningDialog
          onConfirm={() => save({ ...attemptedGoal, confirmKcalWarning: true })}
          onCancel={resetSave}
        />
      ) : null}
      <Button
        title={t('screen-cancel')}
        variant="secondary"
        onPress={() => router.back()}
      />
    </AppScreen>
  )
}
