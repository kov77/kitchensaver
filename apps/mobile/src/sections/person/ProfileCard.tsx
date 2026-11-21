import { useState } from 'react'
import { View } from 'react-native'

import { useUpdatePerson } from '@/api/queries/useUpdatePerson'
import type { PersonDetail } from '@/api/types'
import { Button } from '@/components/atoms/Button'
import { Text } from '@/components/atoms/Text'
import { SectionCard } from '@/components/molecules/SectionCard'
import { ProfileForm } from '@/components/organisms/ProfileForm'
import { PROFILE_TEXT } from '@/components/organisms/profile/constants'
import { formatDisplayDate, parseIsoDate } from '@/utils/dates'
import { getErrorMessage } from '@/utils/errors'

import { PERSON_TEXT } from './constants'
import { styles } from './PersonScreen.styles'

type ProfileCardProps = {
  person: PersonDetail
}

export function ProfileCard({
  person: { id, name, dateOfBirth },
}: ProfileCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const { mutate: updatePerson, error, isPending, reset } = useUpdatePerson(id)
  const birthDate = parseIsoDate(dateOfBirth)

  const stopEditing = () => {
    reset()
    setIsEditing(false)
  }

  return (
    <SectionCard title={PERSON_TEXT.profileTitle}>
      {isEditing ? (
        <>
          <ProfileForm
            initialValues={{ name, dateOfBirth: birthDate }}
            submitLabel={PERSON_TEXT.save}
            isSubmitting={isPending}
            errorMessage={error ? getErrorMessage(error) : null}
            onSubmit={(values) =>
              updatePerson(values, { onSuccess: stopEditing })
            }
          />
          <Button
            title={PERSON_TEXT.cancel}
            variant="secondary"
            onPress={stopEditing}
          />
        </>
      ) : (
        <>
          <View style={styles.field}>
            <Text variant="subtitle" color="textMuted">
              {PROFILE_TEXT.nameLabel}
            </Text>
            <Text variant="body">{name}</Text>
          </View>
          <View style={styles.field}>
            <Text variant="subtitle" color="textMuted">
              {PROFILE_TEXT.dateOfBirthLabel}
            </Text>
            <Text variant="body">{formatDisplayDate(birthDate)}</Text>
          </View>
          <Button
            title={PERSON_TEXT.edit}
            variant="secondary"
            onPress={() => setIsEditing(true)}
          />
        </>
      )}
    </SectionCard>
  )
}
