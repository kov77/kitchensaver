import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { useDeleteAllergy } from '@/api/queries/useDeleteAllergy'
import type { Allergy } from '@/api/types'
import { IconButton } from '@/components/atoms/IconButton'
import { Text } from '@/components/atoms/Text'
import { ConfirmDialog } from '@/components/molecules/ConfirmDialog'
import { FormMessage } from '@/components/molecules/FormMessage'
import { ALLERGEN_LABEL_KEYS } from '@/core/constants'
import { getErrorMessage } from '@/utils/errors'
import { useOpenValue } from '@/utils/useOpen'

import { styles } from './PersonScreen.styles'

type AllergyListProps = {
  personId: string
  personName: string
  allergies: Allergy[]
}

export function AllergyList({
  personId,
  personName,
  allergies,
}: AllergyListProps) {
  const { t } = useTranslation(['person', 'common'])
  const [allergyToRemove, { open: askToRemove, close: closeRemoval }] =
    useOpenValue<Allergy>()
  const { mutate: deleteAllergy, error, isPending } = useDeleteAllergy(personId)

  const getLabel = ({ allergenCode, customLabel }: Allergy) =>
    customLabel ?? t(ALLERGEN_LABEL_KEYS[allergenCode])

  const confirmRemoval = () => {
    if (!allergyToRemove) return
    deleteAllergy(allergyToRemove.id)
    closeRemoval()
  }

  return (
    <>
      <View style={styles.list}>
        {allergies.map((allergy) => (
          <View key={allergy.id} style={styles.row}>
            <Text variant="body" style={styles.name}>
              {getLabel(allergy)}
            </Text>
            <IconButton
              icon="remove"
              variant="danger"
              accessibilityLabel={t('allergy-remove-label', {
                allergen: getLabel(allergy),
              })}
              isDisabled={isPending}
              onPress={() => askToRemove(allergy)}
            />
          </View>
        ))}
      </View>
      {error ? <FormMessage message={getErrorMessage(error)} /> : null}
      {allergyToRemove ? (
        <ConfirmDialog
          title={t('allergy-remove-title', {
            allergen: getLabel(allergyToRemove),
          })}
          message={
            allergies.length === 1
              ? t('allergy-remove-last-message', { name: personName })
              : t('allergy-remove-message', { name: personName })
          }
          confirmLabel={t('allergy-remove-confirm')}
          cancelLabel={t('cancel')}
          confirmVariant="danger"
          onConfirm={confirmRemoval}
          onCancel={closeRemoval}
        />
      ) : null}
    </>
  )
}
