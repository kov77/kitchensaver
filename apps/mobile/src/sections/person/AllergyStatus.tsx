import { useTranslation } from 'react-i18next'

import { useSetAllergyStatus } from '@/api/queries/useSetAllergyStatus'
import type { PersonDetail } from '@/api/types'
import { Button } from '@/components/atoms/Button'
import { Text } from '@/components/atoms/Text'
import { AllergyAnswerForm } from '@/components/organisms/AllergyAnswerForm'
import {
  ALLERGY_ANSWER,
  ANSWER_ALLERGY_STATUS,
} from '@/components/organisms/allergy/constants'
import type { AllergyAnswerValues } from '@/components/organisms/allergy/schemas'
import {
  buildAllergyItems,
  hasWarning,
} from '@/components/organisms/allergy/utils'
import { getErrorMessage } from '@/utils/errors'
import { useOpen } from '@/utils/useOpen'

import { ALLERGY_STATUS_LABEL_KEYS } from './constants'
import type { AddAllergies } from './types'

type AllergyStatusProps = {
  personId: string
  allergyStatus: Exclude<PersonDetail['allergyStatus'], 'HAS_ALLERGIES'>
  addAllergies: AddAllergies
}

export function AllergyStatus({
  personId,
  allergyStatus,
  addAllergies,
}: AllergyStatusProps) {
  const { t } = useTranslation(['person', 'common'])
  const [isEditing, { open: openEditor, close: closeEditor }] = useOpen()
  const setStatus = useSetAllergyStatus(personId)

  const error = setStatus.error ?? addAllergies.error

  const startEditing = () => {
    addAllergies.reset()
    setStatus.reset()
    openEditor()
  }

  const stopEditing = () => {
    addAllergies.reset()
    setStatus.reset()
    closeEditor()
  }

  const submit = (values: AllergyAnswerValues) => {
    if (values.answer === ALLERGY_ANSWER.YES) {
      addAllergies.mutate(buildAllergyItems(values))
      return
    }
    if (!hasWarning(values.answer)) return
    setStatus.mutate(ANSWER_ALLERGY_STATUS[values.answer], {
      onSuccess: stopEditing,
    })
  }

  if (!isEditing) {
    return (
      <>
        <Text variant="body">
          {t(ALLERGY_STATUS_LABEL_KEYS[allergyStatus ?? 'NOT_ANSWERED'])}
        </Text>
        <Button
          title={t('allergy-change-answer')}
          variant="secondary"
          onPress={startEditing}
        />
      </>
    )
  }

  return (
    <>
      <AllergyAnswerForm
        submitLabel={t('save')}
        isSubmitting={addAllergies.isPending || setStatus.isPending}
        errorMessage={error ? getErrorMessage(error) : null}
        onSubmit={submit}
      />
      <Button title={t('cancel')} variant="secondary" onPress={stopEditing} />
    </>
  )
}
