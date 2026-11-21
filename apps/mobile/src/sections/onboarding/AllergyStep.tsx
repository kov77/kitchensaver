import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { View } from 'react-native'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/atoms/Button'
import { Chip } from '@/components/atoms/Chip'
import { Text } from '@/components/atoms/Text'
import { ConfirmDialog } from '@/components/molecules/ConfirmDialog'
import { FormChoiceField } from '@/components/molecules/FormChoiceField'
import { FormMessage } from '@/components/molecules/FormMessage'
import { FormTextField } from '@/components/molecules/FormTextField'
import { ScreenHeader } from '@/components/molecules/ScreenHeader'
import { ALLERGEN_LABEL_KEYS } from '@/core/constants'
import { toOptions } from '@/utils/options'

import {
  ALLERGEN_CODES,
  ALLERGY_ANSWER,
  ALLERGY_ANSWER_LABEL_KEYS,
  OTHER_ALLERGEN_CODE,
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
  const { t } = useTranslation(['onboarding', 'common'])
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
      <ScreenHeader title={t('allergy-title')} />
      <FormChoiceField
        control={control}
        name="answer"
        label={t('allergy-question')}
        labelColor="text"
        options={toOptions(Object.values(ALLERGY_ANSWER), (answer) =>
          t(ALLERGY_ANSWER_LABEL_KEYS[answer]),
        )}
      />
      {answer === ALLERGY_ANSWER.YES ? (
        <View style={styles.group}>
          <Text variant="label" accessibilityRole="header">
            {t('allergens-label')}
          </Text>
          <Controller
            control={control}
            name="allergens"
            render={({ field: { onChange, value } }) => (
              <View style={styles.chips}>
                {ALLERGEN_CODES.map((code) => {
                  const isSelected = value.includes(code)
                  return (
                    <Chip
                      key={code}
                      label={t(ALLERGEN_LABEL_KEYS[code])}
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
          label={t('other-label')}
          placeholder={t('other-placeholder')}
        />
      ) : null}
      {errorMessage ? <FormMessage message={errorMessage} /> : null}
      <Button
        title={t('finish')}
        isLoading={isSubmitting}
        onPress={() => void submit()}
      />
      <Button title={t('back')} variant="secondary" onPress={onBack} />
      <ConfirmDialog
        isVisible={dialog !== null}
        title={dialog ? t(dialog.titleKey) : ''}
        message={dialog ? t(dialog.messageKey) : ''}
        confirmLabel={t('warning-dialog-buttons-confirm')}
        cancelLabel={t('warning-dialog-buttons-cancel')}
        onConfirm={confirmWarning}
        onCancel={() => setPendingValues(null)}
      />
    </>
  )
}
