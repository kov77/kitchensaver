import { zodResolver } from '@hookform/resolvers/zod'
import { View } from 'react-native'
import { Controller, useForm } from 'react-hook-form'

import { useMe } from '@/api/queries/useMe'
import { useRecordConsents } from '@/api/queries/useRecordConsents'
import { Button } from '@/components/atoms/Button'
import { Checkbox } from '@/components/atoms/Checkbox'
import { Spinner } from '@/components/atoms/Spinner'
import { Text } from '@/components/atoms/Text'
import { FormMessage } from '@/components/molecules/FormMessage'
import { ScreenHeader } from '@/components/molecules/ScreenHeader'
import { AppScreen } from '@/components/templates/AppScreen'
import { useSession } from '@/core/auth/SessionProvider'
import { getErrorMessage } from '@/utils/errors'

import { styles } from './ConsentScreen.styles'
import { CONSENT_CHECKBOXES, CONSENT_TEXT, LEGAL_DOCUMENTS } from './constants'
import { consentSchema, type ConsentValues } from './schemas'

export function ConsentScreen() {
  const { signOut } = useSession()
  const { data: me } = useMe({ skipGlobalError: true })
  const { mutate: recordConsents, error, isPending } = useRecordConsents()
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ConsentValues>({
    resolver: zodResolver(consentSchema),
    defaultValues: {
      adultConfirmed: false,
      acceptTerms: false,
      acknowledgePrivacy: false,
    },
  })

  const submit = handleSubmit(() => {
    if (!me) return
    const { termsVersion, privacyVersion } = me.onboarding.currentVersions
    recordConsents({
      adultConfirmed: true,
      acceptTerms: true,
      acknowledgePrivacy: true,
      termsVersion,
      privacyVersion,
    })
  })

  return (
    <AppScreen>
      <ScreenHeader
        title={CONSENT_TEXT.title}
        subtitle={CONSENT_TEXT.subtitle}
      />
      {LEGAL_DOCUMENTS.map(({ id, title, body }) => (
        <View key={id} style={styles.document}>
          <Text variant="label" accessibilityRole="header">
            {title}
          </Text>
          <Text variant="body" color="textMuted">
            {body}
          </Text>
        </View>
      ))}
      <Text variant="subtitle" color="textMuted">
        {CONSENT_TEXT.selfConfirmationNote}
      </Text>
      <View style={styles.checks}>
        {CONSENT_CHECKBOXES.map(({ name, label }) => (
          <Controller
            key={name}
            control={control}
            name={name}
            render={({ field: { onChange, value } }) => (
              <View>
                <Checkbox label={label} isChecked={value} onChange={onChange} />
                {errors[name] ? (
                  <Text
                    variant="link"
                    color="warning"
                    accessibilityLiveRegion="polite"
                  >
                    {errors[name]?.message}
                  </Text>
                ) : null}
              </View>
            )}
          />
        ))}
      </View>
      {error ? <FormMessage message={getErrorMessage(error)} /> : null}
      {me ? (
        <Button
          title={CONSENT_TEXT.submit}
          isLoading={isPending}
          onPress={() => void submit()}
        />
      ) : (
        <Spinner />
      )}
      <Button
        title={CONSENT_TEXT.logOut}
        variant="secondary"
        onPress={() => void signOut()}
      />
    </AppScreen>
  )
}
