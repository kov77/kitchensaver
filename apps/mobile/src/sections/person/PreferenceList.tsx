import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { useDeletePreference } from '@/api/queries/useDeletePreference'
import { useUpdatePreference } from '@/api/queries/useUpdatePreference'
import type { Preference } from '@/api/types'
import { Button } from '@/components/atoms/Button'
import { Text } from '@/components/atoms/Text'
import { FormMessage } from '@/components/molecules/FormMessage'
import { RatingChips } from '@/components/molecules/RatingChips'
import { RATINGS } from '@/core/constants'
import type { Rating } from '@/core/types'
import { getErrorMessage } from '@/utils/errors'

import { styles } from './PersonScreen.styles'

type PreferenceListProps = {
  personId: string
  preferences: Preference[]
}

export function PreferenceList({ personId, preferences }: PreferenceListProps) {
  const { t } = useTranslation('person')
  const updatePreference = useUpdatePreference(personId)
  const deletePreference = useDeletePreference(personId)
  const error = updatePreference.error ?? deletePreference.error
  const isChanging = updatePreference.isPending || deletePreference.isPending

  const changeRating = (preferenceId: string, rating: Rating) => {
    if (isChanging) return
    deletePreference.reset()
    updatePreference.mutate({ preferenceId, rating })
  }

  const remove = (preferenceId: string) => {
    if (isChanging) return
    updatePreference.reset()
    deletePreference.mutate(preferenceId)
  }

  if (preferences.length === 0) {
    return <Text variant="body">{t('preferences-empty')}</Text>
  }

  return (
    <>
      <View style={styles.list}>
        {preferences.map(({ id, ingredientName, rating }) => (
          <View key={id} style={styles.item}>
            <View style={styles.row}>
              <Text variant="body">{ingredientName}</Text>
              <Button
                title={t('preference-remove')}
                accessibilityLabel={t('preference-remove-label', {
                  food: ingredientName,
                })}
                variant="secondary"
                isLoading={deletePreference.isPending}
                onPress={() => remove(id)}
              />
            </View>
            <RatingChips
              label={t('preference-rating-label', { food: ingredientName })}
              getOptionLabel={(option) =>
                t('preference-rating-option', {
                  food: ingredientName,
                  rating: option,
                })
              }
              values={RATINGS}
              value={rating}
              onChange={(nextRating) => changeRating(id, nextRating)}
            />
          </View>
        ))}
      </View>
      {error ? <FormMessage message={getErrorMessage(error)} /> : null}
    </>
  )
}
