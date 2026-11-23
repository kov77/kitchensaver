import { View } from 'react-native'
import { useTranslation } from 'react-i18next'

import { useUpdatePerson } from '@/api/queries/useUpdatePerson'
import type { PersonDetail } from '@/api/types'
import { Button } from '@/components/atoms/Button'
import { Text } from '@/components/atoms/Text'
import { SectionCard } from '@/components/molecules/SectionCard'
import { ProfileForm } from '@/components/organisms/ProfileForm'
import { formatDisplayDate, parseIsoDate } from '@/utils/dates'
import { getErrorMessage } from '@/utils/errors'
import { useOpen } from '@/utils/useOpen'

import { styles } from './PersonScreen.styles'

type ProfileCardProps = {
  person: PersonDetail
}

export function ProfileCard({
  person: { id, name, dateOfBirth },
}: ProfileCardProps) {
  const { t } = useTranslation(['person', 'profile'])
  const [isEditing, { open: startEditing, close: closeEditor }] = useOpen()
  const { mutate: updatePerson, error, isPending, reset } = useUpdatePerson(id)
  const birthDate = parseIsoDate(dateOfBirth)

  const stopEditing = () => {
    reset()
    closeEditor()
  }

  return (
    <SectionCard title={t('profile-title')}>
      {isEditing ? (
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
          <Button
            title={t('cancel')}
            variant="secondary"
            onPress={stopEditing}
          />
        </>
      ) : (
        <>
          <View style={styles.field}>
            <Text variant="subtitle" color="textMuted">
              {t('profile:name-label')}
            </Text>
            <Text variant="body">{name}</Text>
          </View>
          <View style={styles.field}>
            <Text variant="subtitle" color="textMuted">
              {t('profile:date-of-birth-label')}
            </Text>
            <Text variant="body">{formatDisplayDate(birthDate)}</Text>
          </View>
          <Button
            title={t('edit')}
            variant="secondary"
            onPress={startEditing}
          />
        </>
      )}
    </SectionCard>
  )
}
