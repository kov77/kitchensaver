import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { View } from 'react-native'

import { Button } from '@/components/atoms/Button'
import { Chip } from '@/components/atoms/Chip'
import { Text } from '@/components/atoms/Text'
import { ConfirmDialog } from '@/components/molecules/ConfirmDialog'
import { FormChoiceField } from '@/components/molecules/FormChoiceField'
import { FormMessage } from '@/components/molecules/FormMessage'
import { FormTextField } from '@/components/molecules/FormTextField'
import { ScreenHeader } from '@/components/molecules/ScreenHeader'

import {
  ALLERGEN_OPTIONS,
  ALLERGY_ANSWER,
  ALLERGY_ANSWERS,
  ONBOARDING_TEXT,
  OTHER_ALLERGEN_CODE,
  WARNING_DIALOG_BUTTONS,
} from './constants'
import { styles } from './Onboarding.styles'
import { allergySchema, type AllergyValues } from './schemas'
import { getWarningDialog } from './utils'

type AllergyStepProps = {
  errorMessage: string | null
  isSubmitting: boolean
  onBack: () => void
  onSubmit: (values: AllergyValues) => void
}

export function AllergyStep({
  errorMessage,
  isSubmitting,
  onBack,
  onSubmit,
}: AllergyStepProps) {
  const [pendingValues, setPendingValues] = useState<AllergyValues | null>(null)
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<AllergyValues>({
    resolver: zodResolver(allergySchema),
    defaultValues: { answer: null, allergens: [], otherLabel: '' },
  })
  const answer = watch('answer')
  const allergens = watch('allergens')

  const submit = handleSubmit((values) => {
    if (values.answer === ALLERGY_ANSWER.YES) {
      onSubmit(values)
      return
    }
    setPendingValues(values)
  })

  const dialog = getWarningDialog(pendingValues)

  const confirmWarning = () => {
    if (!pendingValues) return
    onSubmit(pendingValues)
    setPendingValues(null)
  }

  return (
    <>
      <ScreenHeader title={ONBOARDING_TEXT.allergyTitle} />
      <FormChoiceField
        control={control}
        name="answer"
        label={ONBOARDING_TEXT.allergyQuestion}
        labelColor="text"
        options={ALLERGY_ANSWERS}
      />
      {answer === ALLERGY_ANSWER.YES ? (
        <View style={styles.group}>
          <Text variant="label" accessibilityRole="header">
            {ONBOARDING_TEXT.allergensLabel}
          </Text>
          <Controller
            control={control}
            name="allergens"
            render={({ field: { onChange, value } }) => (
              <View style={styles.chips}>
                {ALLERGEN_OPTIONS.map(({ value: code, label }) => {
                  const isSelected = value.includes(code)
                  return (
                    <Chip
                      key={code}
                      label={label}
                      isSelected={isSelected}
                      onPress={() =>
                        onChange(
                          isSelected
                            ? value.filter((selected) => selected !== code)
                            : [...value, code],
                        )
                      }
                    />
                  )
                })}
              </View>
            )}
          />
          {errors.allergens ? (
            <Text
              variant="link"
              color="warning"
              accessibilityLiveRegion="polite"
            >
              {errors.allergens.message}
            </Text>
          ) : null}
        </View>
      ) : null}
      {answer === ALLERGY_ANSWER.YES &&
      allergens.includes(OTHER_ALLERGEN_CODE) ? (
        <FormTextField
          control={control}
          name="otherLabel"
          label={ONBOARDING_TEXT.otherLabel}
          placeholder={ONBOARDING_TEXT.otherPlaceholder}
        />
      ) : null}
      {errorMessage ? <FormMessage message={errorMessage} /> : null}
      <Button
        title={ONBOARDING_TEXT.finish}
        isLoading={isSubmitting}
        onPress={() => void submit()}
      />
      <Button
        title={ONBOARDING_TEXT.back}
        variant="secondary"
        onPress={onBack}
      />
      <ConfirmDialog
        isVisible={dialog !== null}
        title={dialog?.title ?? ''}
        message={dialog?.message ?? ''}
        confirmLabel={WARNING_DIALOG_BUTTONS.confirm}
        cancelLabel={WARNING_DIALOG_BUTTONS.cancel}
        onConfirm={confirmWarning}
        onCancel={() => setPendingValues(null)}
      />
    </>
  )
}
