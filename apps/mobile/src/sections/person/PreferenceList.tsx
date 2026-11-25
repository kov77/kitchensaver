import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { useDeletePreference } from '@/api/queries/useDeletePreference'
import { useUpdatePreference } from '@/api/queries/useUpdatePreference'
import type { Preference } from '@/api/types'
import { Text } from '@/components/atoms/Text'
import { ConfirmDialog } from '@/components/molecules/ConfirmDialog'
import { FormMessage } from '@/components/molecules/FormMessage'
import { getErrorMessage } from '@/utils/errors'
import { findRating } from '@/utils/ratings'
import { useOpenValue } from '@/utils/useOpen'

import { styles } from './PersonScreen.styles'
import { PreferenceRow } from './PreferenceRow'

type PreferenceListProps = {
  personId: string
  personName: string
  preferences: Preference[]
}

export function PreferenceList({
  personId,
  personName,
  preferences,
}: PreferenceListProps) {
  const { t } = useTranslation('person')
  const [preferenceToRemove, { open: askToRemove, close: closeRemoval }] =
    useOpenValue<Preference>()
  const updatePreference = useUpdatePreference(personId)
  const deletePreference = useDeletePreference(personId)
  const error = updatePreference.error ?? deletePreference.error
  const isChanging = updatePreference.isPending || deletePreference.isPending
  const pendingChange = updatePreference.isPending
    ? updatePreference.variables
    : undefined

  const changeRating = (preferenceId: string, value: number) => {
    const rating = findRating(value)
    if (isChanging || rating === undefined) return
    deletePreference.reset()
    updatePreference.mutate({ preferenceId, rating })
  }

  const confirmRemoval = () => {
    if (!preferenceToRemove) return
    closeRemoval()
    updatePreference.reset()
    deletePreference.mutate(preferenceToRemove.id)
  }

  if (preferences.length === 0) {
    return <Text variant="body">{t('preferences-empty')}</Text>
  }

  return (
    <>
      <View style={styles.list}>
        {preferences.map((preference) => (
          <PreferenceRow
            key={preference.id}
            preference={preference}
            rating={
              pendingChange?.preferenceId === preference.id
                ? pendingChange.rating
                : preference.rating
            }
            isDisabled={isChanging}
            onChangeRating={(value) => changeRating(preference.id, value)}
            onRemove={() => askToRemove(preference)}
          />
        ))}
      </View>
      {error ? <FormMessage message={getErrorMessage(error)} /> : null}
      {preferenceToRemove ? (
        <ConfirmDialog
          title={t('preference-remove-title', {
            food: preferenceToRemove.ingredientName,
          })}
          message={t('preference-remove-message', { name: personName })}
          confirmLabel={t('preference-remove-confirm')}
          cancelLabel={t('cancel')}
          confirmVariant="danger"
          onConfirm={confirmRemoval}
          onCancel={closeRemoval}
        />
      ) : null}
    </>
  )
}
