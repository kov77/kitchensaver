import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { useDeleteExclusion } from '@/api/queries/useDeleteExclusion'
import type { Exclusion } from '@/api/types'
import { Button } from '@/components/atoms/Button'
import { Text } from '@/components/atoms/Text'
import { ConfirmDialog } from '@/components/molecules/ConfirmDialog'
import { FormMessage } from '@/components/molecules/FormMessage'
import { getErrorMessage } from '@/utils/errors'
import { useOpenValue } from '@/utils/useOpen'

import { styles } from './PersonScreen.styles'

type ExclusionListProps = {
  personId: string
  personName: string
  exclusions: Exclusion[]
}

export function ExclusionList({
  personId,
  personName,
  exclusions,
}: ExclusionListProps) {
  const { t } = useTranslation('person')
  const [exclusionToRemove, { open: askToRemove, close: closeRemoval }] =
    useOpenValue<Exclusion>()
  const {
    mutate: deleteExclusion,
    error,
    isPending,
  } = useDeleteExclusion(personId)

  const confirmRemoval = () => {
    if (!exclusionToRemove) return
    deleteExclusion(exclusionToRemove.id)
    closeRemoval()
  }

  if (exclusions.length === 0) {
    return <Text variant="body">{t('exclusions-empty')}</Text>
  }

  return (
    <>
      <View style={styles.list}>
        {exclusions.map((exclusion) => (
          <View key={exclusion.id} style={styles.row}>
            <Text variant="body">{exclusion.ingredientName}</Text>
            <Button
              title={t('exclusion-remove')}
              accessibilityLabel={t('exclusion-remove-label', {
                food: exclusion.ingredientName,
              })}
              variant="secondary"
              isLoading={isPending}
              onPress={() => askToRemove(exclusion)}
            />
          </View>
        ))}
      </View>
      {error ? <FormMessage message={getErrorMessage(error)} /> : null}
      {exclusionToRemove ? (
        <ConfirmDialog
          title={t('exclusion-remove-title', {
            food: exclusionToRemove.ingredientName,
          })}
          message={t('exclusion-remove-message', {
            name: personName,
            food: exclusionToRemove.ingredientName,
          })}
          confirmLabel={t('exclusion-remove-confirm')}
          cancelLabel={t('cancel')}
          confirmVariant="danger"
          onConfirm={confirmRemoval}
          onCancel={closeRemoval}
        />
      ) : null}
    </>
  )
}
