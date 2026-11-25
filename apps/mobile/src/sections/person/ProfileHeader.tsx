import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { useUpdatePerson } from '@/api/queries/useUpdatePerson'
import type { PersonDetail } from '@/api/types'
import { Button } from '@/components/atoms/Button'
import { IconButton } from '@/components/atoms/IconButton'
import { ScreenHeader } from '@/components/molecules/ScreenHeader'
import { ProfileForm } from '@/components/organisms/ProfileForm'
import { formatDisplayDate, parseIsoDate } from '@/utils/dates'
import { getErrorMessage } from '@/utils/errors'
import { useOpen } from '@/utils/useOpen'

import { styles } from './PersonScreen.styles'

type ProfileHeaderProps = {
  person: PersonDetail
}

export function ProfileHeader({
  person: { id, name, age, dateOfBirth },
}: ProfileHeaderProps) {
  const { t } = useTranslation('person')
  const [isEditing, { open: startEditing, close: closeEditor }] = useOpen()
  const { mutate: updatePerson, error, isPending, reset } = useUpdatePerson(id)
  const birthDate = parseIsoDate(dateOfBirth)

  const stopEditing = () => {
    reset()
    closeEditor()
  }

  if (isEditing) {
    return (
      <>
        <ProfileForm
          initialValues={{ name, dateOfBirth: birthDate }}
          submitLabel={t('save')}
          isSubmitting={isPending}
          errorMessage={error ? getErrorMessage(error) : null}
          onSubmit={(values) =>
            updatePerson(values, { onSuccess: stopEditing })
          }
        />
        <Button title={t('cancel')} variant="secondary" onPress={stopEditing} />
      </>
    )
  }

  return (
    <View style={styles.header}>
      <View style={styles.name}>
        <ScreenHeader
          title={name}
          subtitle={t('profile-summary', {
            age,
            date: formatDisplayDate(birthDate),
          })}
        />
      </View>
      <IconButton
        icon="edit"
        accessibilityLabel={t('profile-edit')}
        onPress={startEditing}
      />
    </View>
  )
}
