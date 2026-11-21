import { zodResolver } from '@hookform/resolvers/zod'
import { View } from 'react-native'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { useMe } from '@/api/queries/useMe'
import { useRecordConsents } from '@/api/queries/useRecordConsents'
import { Button } from '@/components/atoms/Button'
import { Spinner } from '@/components/atoms/Spinner'
import { Text } from '@/components/atoms/Text'
import { FormCheckbox } from '@/components/molecules/FormCheckbox'
import { FormMessage } from '@/components/molecules/FormMessage'
import { ScreenHeader } from '@/components/molecules/ScreenHeader'
import { AppScreen } from '@/components/templates/AppScreen'
import { useSession } from '@/core/auth/SessionProvider'
import { getErrorMessage } from '@/utils/errors'

import { styles } from './ConsentScreen.styles'
import { CONSENT_CHECKBOXES, LEGAL_DOCUMENTS } from './constants'
import { consentSchema, type ConsentValues } from './schemas'

export function ConsentScreen() {
  const { t } = useTranslation('consent')
  const { signOut } = useSession()
  const { data: me } = useMe({ skipGlobalError: true })
  const { mutate: recordConsents, error, isPending } = useRecordConsents()
  const { control, handleSubmit } = useForm<ConsentValues>({
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
      <ScreenHeader title={t('title')} subtitle={t('subtitle')} />
      {LEGAL_DOCUMENTS.map(({ id, titleKey, bodyKey }) => (
        <View key={id} style={styles.document}>
          <Text variant="label" accessibilityRole="header">
            {t(titleKey)}
          </Text>
          <Text variant="body" color="textMuted">
            {t(bodyKey)}
          </Text>
        </View>
      ))}
      <Text variant="subtitle" color="textMuted">
        {t('self-confirmation-note')}
      </Text>
      <View style={styles.checks}>
        {CONSENT_CHECKBOXES.map(({ name, labelKey }) => (
          <FormCheckbox
            key={name}
            control={control}
            name={name}
            label={t(labelKey)}
          />
        ))}
      </View>
      {error ? <FormMessage message={getErrorMessage(error)} /> : null}
      {me ? (
        <Button
          title={t('submit')}
          isLoading={isPending}
          onPress={() => void submit()}
        />
      ) : (
        <Spinner />
      )}
      <Button
        title={t('log-out')}
        variant="secondary"
        onPress={() => void signOut()}
      />
    </AppScreen>
  )
}
