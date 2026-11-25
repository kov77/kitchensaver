import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import type { Preference } from '@/api/types'
import { IconButton } from '@/components/atoms/IconButton'
import { Text } from '@/components/atoms/Text'
import { Stepper } from '@/components/molecules/Stepper'
import { RATING_LIMITS } from '@/core/constants'

import { styles } from './PersonScreen.styles'

type PreferenceRowProps = {
  preference: Preference
  rating: number
  isDisabled: boolean
  onChangeRating: (rating: number) => void
  onRemove: () => void
}

export function PreferenceRow({
  preference: { ingredientName },
  rating,
  isDisabled,
  onChangeRating,
  onRemove,
}: PreferenceRowProps) {
  const { t } = useTranslation('person')

  return (
    <View style={styles.row}>
      <Text variant="body" style={styles.name}>
        {ingredientName}
      </Text>
      <Stepper
        value={rating}
        min={RATING_LIMITS.min}
        max={RATING_LIMITS.max}
        label={t('preference-rating-label', { food: ingredientName })}
        decreaseLabel={t('preference-rating-lower', { food: ingredientName })}
        increaseLabel={t('preference-rating-higher', { food: ingredientName })}
        isDisabled={isDisabled}
        onChange={onChangeRating}
      />
      <IconButton
        icon="remove"
        variant="danger"
        accessibilityLabel={t('preference-remove-label', {
          food: ingredientName,
        })}
        isDisabled={isDisabled}
        onPress={onRemove}
      />
    </View>
  )
}
