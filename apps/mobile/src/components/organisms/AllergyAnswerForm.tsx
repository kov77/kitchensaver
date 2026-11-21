import { zodResolver } from '@hookform/resolvers/zod'
import { FormProvider, useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/atoms/Button'
import { FormChoiceField } from '@/components/molecules/FormChoiceField'
import { FormMessage } from '@/components/molecules/FormMessage'
import { toOptions } from '@/utils/options'
import { useOpenValue } from '@/utils/useOpen'

import { AllergenFields } from './allergy/AllergenFields'
import { AllergyWarningDialog } from './allergy/AllergyWarningDialog'
import { ALLERGY_ANSWER, ALLERGY_ANSWER_LABEL_KEYS } from './allergy/constants'
import {
  allergyAnswerSchema,
  type AllergyAnswerValues,
} from './allergy/schemas'
import { hasWarning } from './allergy/utils'

type AllergyAnswerFormProps = {
  submitLabel: string
  isSubmitting: boolean
  errorMessage: string | null
  onSubmit: (values: AllergyAnswerValues) => void
}

export function AllergyAnswerForm({
  submitLabel,
  isSubmitting,
  errorMessage,
  onSubmit,
}: AllergyAnswerFormProps) {
  const { t } = useTranslation('allergy')
  const [pendingValues, { open: askToConfirm, close: closeConfirmation }] =
    useOpenValue<AllergyAnswerValues>()
  const form = useForm<AllergyAnswerValues>({
    resolver: zodResolver(allergyAnswerSchema),
    defaultValues: { answer: null, allergens: [], otherLabel: '' },
  })
  const answer = useWatch({ control: form.control, name: 'answer' })

  const submit = form.handleSubmit((values) => {
    if (hasWarning(values.answer)) {
      askToConfirm(values)
      return
    }
    onSubmit(values)
  })

  const confirmWarning = () => {
    if (!pendingValues) return
    onSubmit(pendingValues)
    closeConfirmation()
  }

  return (
    <FormProvider {...form}>
      <FormChoiceField
        control={form.control}
        name="answer"
        label={t('allergy-question')}
        labelColor="text"
        options={toOptions(Object.values(ALLERGY_ANSWER), (value) =>
          t(ALLERGY_ANSWER_LABEL_KEYS[value]),
        )}
      />
      {answer === ALLERGY_ANSWER.YES ? <AllergenFields /> : null}
      {errorMessage ? <FormMessage message={errorMessage} /> : null}
      <Button
        title={submitLabel}
        isLoading={isSubmitting}
        onPress={() => void submit()}
      />
      {pendingValues && hasWarning(pendingValues.answer) ? (
        <AllergyWarningDialog
          answer={pendingValues.answer}
          onConfirm={confirmWarning}
          onCancel={closeConfirmation}
        />
      ) : null}
    </FormProvider>
  )
}
