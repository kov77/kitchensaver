import { useLocalSearchParams, useRouter } from 'expo-router'

import { requestGoalEstimate } from '@/api/goalRequests'
import { useSaveGoal } from '@/api/queries/useSaveGoal'
import { Button } from '@/components/atoms/Button'
import { ScreenHeader } from '@/components/molecules/ScreenHeader'
import { GoalEditor } from '@/components/organisms/GoalEditor'
import { AppScreen } from '@/components/templates/AppScreen'
import type { GoalDraft } from '@/core/types'
import { getErrorMessage } from '@/utils/errors'

import { GOAL_TEXT } from './constants'

export function GoalScreen() {
  const { personId } = useLocalSearchParams<{ personId: string }>()
  const router = useRouter()
  const { mutate: saveGoal, error, isPending } = useSaveGoal(personId)

  const save = (draft: GoalDraft) =>
    saveGoal(draft, { onSuccess: () => router.back() })

  return (
    <AppScreen>
      <ScreenHeader title={GOAL_TEXT.title} subtitle={GOAL_TEXT.subtitle} />
      <GoalEditor
        submitLabel={GOAL_TEXT.save}
        isSaving={isPending}
        saveErrorMessage={error ? getErrorMessage(error) : null}
        onEstimate={(input) => requestGoalEstimate(personId, input)}
        onSave={save}
      />
      <Button
        title={GOAL_TEXT.cancel}
        variant="secondary"
        onPress={() => router.back()}
      />
    </AppScreen>
  )
}
