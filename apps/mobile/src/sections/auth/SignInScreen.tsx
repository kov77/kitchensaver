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

import { AUTH_FAILURE_KEYS } from './constants'
import { signInSchema, type SignInValues } from './schemas'

export function SignInScreen() {
  const { t } = useTranslation(['auth', 'common'])
  const { signIn } = useSession()
  const [failure, setFailure] = useState<AuthFailure | null>(null)
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  })

  const submit = handleSubmit(async (values) => {
    setFailure(null)
    const result = await signIn(values)
    if (!result.ok) setFailure(result.failure)
  })

  return (
    <AppScreen>
      <ScreenHeader
        title={t('sign-in-title')}
        subtitle={t('sign-in-subtitle')}
      />
      <FormTextField
        control={control}
        name="email"
        label={t('sign-in-email-label')}
        autoCapitalize="none"
        autoComplete="email"
        autoCorrect={false}
        keyboardType="email-address"
        placeholder={t('sign-in-email-placeholder')}
        textContentType="emailAddress"
      />
      <FormTextField
        control={control}
        name="password"
        label={t('sign-in-password-label')}
        isPassword
        autoCapitalize="none"
        autoComplete="current-password"
        autoCorrect={false}
        textContentType="password"
        onSubmitEditing={() => void submit()}
      />
      {failure ? <FormMessage message={t(AUTH_FAILURE_KEYS[failure])} /> : null}
      <Button
        title={t('sign-in-submit')}
        isLoading={isSubmitting}
        onPress={() => void submit()}
      />
      <FooterLink
        prompt={t('sign-in-footer-prompt')}
        linkLabel={t('sign-in-footer-link')}
        href="/sign-up"
      />
    </AppScreen>
  )
}
