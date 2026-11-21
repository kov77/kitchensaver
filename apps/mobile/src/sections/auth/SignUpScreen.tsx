import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/atoms/Button'
import { FooterLink } from '@/components/molecules/FooterLink'
import { FormMessage } from '@/components/molecules/FormMessage'
import { FormTextField } from '@/components/molecules/FormTextField'
import { ScreenHeader } from '@/components/molecules/ScreenHeader'
import { AppScreen } from '@/components/templates/AppScreen'
import type { AuthFailure } from '@/core/auth/types'
import { useSession } from '@/core/auth/SessionProvider'

import { AUTH_FAILURE_KEYS, PASSWORD_MIN_LENGTH } from './constants'
import { signUpSchema, type SignUpValues } from './schemas'

export function SignUpScreen() {
  const { t } = useTranslation(['auth', 'common'])
  const { signUp } = useSession()
  const [failure, setFailure] = useState<AuthFailure | null>(null)
  const [isEmailConfirmationSent, setIsEmailConfirmationSent] = useState(false)
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: '', password: '' },
  })

  const submit = handleSubmit(async (values) => {
    setFailure(null)
    setIsEmailConfirmationSent(false)
    const result = await signUp(values)
    if (!result.ok) {
      setFailure(result.failure)
      return
    }
    setIsEmailConfirmationSent(result.emailConfirmationRequired)
  })

  return (
    <AppScreen>
      <ScreenHeader
        title={t('sign-up-title')}
        subtitle={t('sign-up-subtitle')}
      />
      <FormTextField
        control={control}
        name="email"
        label={t('sign-up-email-label')}
        autoCapitalize="none"
        autoComplete="email"
        autoCorrect={false}
        keyboardType="email-address"
        placeholder={t('sign-up-email-placeholder')}
        textContentType="emailAddress"
      />
      <FormTextField
        control={control}
        name="password"
        label={t('sign-up-password-label')}
        isPassword
        autoCapitalize="none"
        autoComplete="new-password"
        autoCorrect={false}
        placeholder={t('sign-up-password-placeholder', {
          min: PASSWORD_MIN_LENGTH,
        })}
        textContentType="newPassword"
        onSubmitEditing={() => void submit()}
      />
      {failure ? <FormMessage message={t(AUTH_FAILURE_KEYS[failure])} /> : null}
      {isEmailConfirmationSent ? (
        <FormMessage message={t('check-email')} tone="info" />
      ) : null}
      <Button
        title={t('sign-up-submit')}
        isLoading={isSubmitting}
        onPress={() => void submit()}
      />
      <FooterLink
        prompt={t('sign-up-footer-prompt')}
        linkLabel={t('sign-up-footer-link')}
        href="/sign-in"
      />
    </AppScreen>
  )
}
