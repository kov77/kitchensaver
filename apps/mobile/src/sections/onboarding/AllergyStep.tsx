import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { View } from 'react-native'

import { Button } from '@/components/atoms/Button'
import { Chip } from '@/components/atoms/Chip'
import { Text } from '@/components/atoms/Text'
import { ConfirmDialog } from '@/components/molecules/ConfirmDialog'
import { FormMessage } from '@/components/molecules/FormMessage'
import { ScreenHeader } from '@/components/molecules/ScreenHeader'
import { TextField } from '@/components/molecules/TextField'

import {
  ALLERGEN_LABELS,
  ALLERGY_ANSWER,
  ALLERGY_ANSWERS,
  ONBOARDING_TEXT,
  OTHER_ALLERGEN_CODE,
  WARNING_DIALOG_BUTTONS,
  WARNING_DIALOGS,
} from './constants'
import { styles } from './Onboarding.styles'
import { allergySchema, type AllergyValues } from './schemas'

type AllergyStepProps = {
  errorMessage: string | null
  isSubmitting: boolean
  onBack: () => void
  onSubmit: (values: AllergyValues) => void
}

type WarnedAnswer = typeof ALLERGY_ANSWER.NO | typeof ALLERGY_ANSWER.UNKNOWN

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

  const warnedAnswer: WarnedAnswer | null =
    pendingValues?.answer === ALLERGY_ANSWER.NO ||
    pendingValues?.answer === ALLERGY_ANSWER.UNKNOWN
      ? pendingValues.answer
      : null
  const dialog = warnedAnswer ? WARNING_DIALOGS[warnedAnswer] : null

  const confirmWarning = () => {
    if (!pendingValues) return
    onSubmit(pendingValues)
    setPendingValues(null)
  }

  return (
    <>
      <ScreenHeader title={ONBOARDING_TEXT.allergyTitle} />
      <View style={styles.group}>
        <Text variant="label" accessibilityRole="header">
          {ONBOARDING_TEXT.allergyQuestion}
        </Text>
        <Controller
          control={control}
          name="answer"
          render={({ field: { onChange, value } }) => (
            <View style={styles.chips}>
              {ALLERGY_ANSWERS.map(({ value: option, label }) => (
                <Chip
                  key={option}
                  label={label}
                  role="radio"
                  isSelected={value === option}
                  onPress={() => onChange(option)}
                />
              ))}
            </View>
          )}
        />
        {errors.answer ? (
          <Text variant="link" color="warning" accessibilityLiveRegion="polite">
            {errors.answer.message}
          </Text>
        ) : null}
      </View>
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
                {Object.entries(ALLERGEN_LABELS).map(([code, label]) => {
                  const isSelected = value.some((selected) => selected === code)
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
      allergens.some((code) => code === OTHER_ALLERGEN_CODE) ? (
        <Controller
          control={control}
          name="otherLabel"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextField
              label={ONBOARDING_TEXT.otherLabel}
              errorMessage={errors.otherLabel?.message}
              placeholder={ONBOARDING_TEXT.otherPlaceholder}
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
            />
          )}
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
