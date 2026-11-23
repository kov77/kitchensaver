import { Controller, useFormContext, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { Chip } from '@/components/atoms/Chip'
import { Text } from '@/components/atoms/Text'
import { FormTextField } from '@/components/molecules/FormTextField'
import { ALLERGEN_LABEL_KEYS } from '@/core/constants'
import type { AllergenCode } from '@/core/types'

import { styles } from './AllergenFields.styles'
import { ALLERGEN_CODES, OTHER_ALLERGEN_CODE } from './constants'
import type { AllergenSelection } from './schemas'
import { toggleAllergen } from './utils'

type AllergenFieldsProps = {
  codes?: readonly AllergenCode[]
}

export function AllergenFields({
  codes = ALLERGEN_CODES,
}: AllergenFieldsProps) {
  const { t } = useTranslation(['allergy', 'common'])
  const {
    control,
    formState: { errors },
  } = useFormContext<AllergenSelection>()
  const allergens = useWatch({ control, name: 'allergens' })

  return (
    <>
      <View style={styles.group}>
        <Text variant="label" accessibilityRole="header">
          {t('allergens-label')}
        </Text>
        <Controller
          control={control}
          name="allergens"
          render={({ field: { value, onChange } }) => (
            <View style={styles.chips}>
              {codes.map((code) => (
                <Chip
                  key={code}
                  label={t(ALLERGEN_LABEL_KEYS[code])}
                  isSelected={value.includes(code)}
                  onPress={() => onChange(toggleAllergen(value, code))}
                />
              ))}
            </View>
          )}
        />
        {errors.allergens ? (
          <Text variant="link" color="warning" accessibilityLiveRegion="polite">
            {errors.allergens.message}
          </Text>
        ) : null}
      </View>
      {allergens.includes(OTHER_ALLERGEN_CODE) ? (
        <FormTextField
          control={control}
          name="otherLabel"
          label={t('other-label')}
          placeholder={t('other-placeholder')}
        />
      ) : null}
    </>
  )
}
