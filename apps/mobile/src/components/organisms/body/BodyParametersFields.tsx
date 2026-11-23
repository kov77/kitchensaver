import { useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { FormChoiceField } from '@/components/molecules/FormChoiceField'
import { FormTextField } from '@/components/molecules/FormTextField'
import { ACTIVITY_LEVEL_LABEL_KEYS, SEX_LABEL_KEYS } from '@/core/constants'
import { toOptions } from '@/utils/options'

import { ACTIVITY_LEVELS, FORMULA_SEXES } from './constants'
import type { BodyParametersValues } from './schemas'

export function BodyParametersFields() {
  const { t } = useTranslation(['body', 'common'])
  const { control } = useFormContext<BodyParametersValues>()

  return (
    <>
      <FormTextField
        control={control}
        name="heightCm"
        label={t('height-label')}
        keyboardType="decimal-pad"
      />
      <FormTextField
        control={control}
        name="weightKg"
        label={t('weight-label')}
        keyboardType="decimal-pad"
      />
      <FormChoiceField
        control={control}
        name="activityLevel"
        label={t('activity-label')}
        options={toOptions(ACTIVITY_LEVELS, (level) =>
          t(ACTIVITY_LEVEL_LABEL_KEYS[level]),
        )}
      />
      <FormChoiceField
        control={control}
        name="formulaSex"
        label={t('sex-label')}
        options={toOptions(FORMULA_SEXES, (sex) => t(SEX_LABEL_KEYS[sex]))}
      />
    </>
  )
}
