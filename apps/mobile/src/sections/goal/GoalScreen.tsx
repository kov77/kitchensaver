import { useLocalSearchParams, useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'

import { requestGoalEstimate } from '@/api/goalRequests'
import { useSaveGoal } from '@/api/queries/useSaveGoal'
import { Button } from '@/components/atoms/Button'
import { ScreenHeader } from '@/components/molecules/ScreenHeader'
import { GoalEditor } from '@/components/organisms/GoalEditor'
import { AppScreen } from '@/components/templates/AppScreen'
import type { GoalDraft } from '@/core/types'
import { getErrorMessage } from '@/utils/errors'

export function GoalScreen() {
  const { t } = useTranslation('goal')
  const { personId } = useLocalSearchParams<{ personId: string }>()
  const router = useRouter()
  const { mutate: saveGoal, error, isPending } = useSaveGoal(personId)

  const save = (draft: GoalDraft) =>
    saveGoal(draft, { onSuccess: () => router.back() })

  return (
    <AppScreen>
      <ScreenHeader title={t('screen-title')} subtitle={t('screen-subtitle')} />
      <GoalEditor
        submitLabel={t('screen-save')}
        isSaving={isPending}
        saveErrorMessage={error ? getErrorMessage(error) : null}
        onEstimate={(input) => requestGoalEstimate(personId, input)}
        onSave={save}
      />
      <Button
        title={t('screen-cancel')}
        variant="secondary"
        onPress={() => router.back()}
      />
    </AppScreen>
  )
}
