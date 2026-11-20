import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/atoms/Button'
import { FooterLink } from '@/components/molecules/FooterLink'
import { FormMessage } from '@/components/molecules/FormMessage'
import { FormTextField } from '@/components/molecules/FormTextField'
import { ScreenHeader } from '@/components/molecules/ScreenHeader'
import { AppScreen } from '@/components/templates/AppScreen'
import type { AuthFailure } from '@/core/auth/types'
import { useSession } from '@/core/auth/SessionProvider'

import {
  AUTH_FAILURE_MESSAGES,
  CHECK_EMAIL_MESSAGE,
  SIGN_UP_TEXT,
} from './constants'
import { signUpSchema, type SignUpValues } from './schemas'

export function SignUpScreen() {
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
        title={SIGN_UP_TEXT.title}
        subtitle={SIGN_UP_TEXT.subtitle}
      />
      <FormTextField
        control={control}
        name="email"
        label={SIGN_UP_TEXT.emailLabel}
        autoCapitalize="none"
        autoComplete="email"
        autoCorrect={false}
        keyboardType="email-address"
        placeholder={SIGN_UP_TEXT.emailPlaceholder}
        textContentType="emailAddress"
      />
      <FormTextField
        control={control}
        name="password"
        label={SIGN_UP_TEXT.passwordLabel}
        isPassword
        autoCapitalize="none"
        autoComplete="new-password"
        autoCorrect={false}
        placeholder={SIGN_UP_TEXT.passwordPlaceholder}
        textContentType="newPassword"
        onSubmitEditing={() => void submit()}
      />
      {failure ? (
        <FormMessage message={AUTH_FAILURE_MESSAGES[failure]} />
      ) : null}
      {isEmailConfirmationSent ? (
        <FormMessage message={CHECK_EMAIL_MESSAGE} tone="info" />
      ) : null}
      <Button
        title={SIGN_UP_TEXT.submit}
        isLoading={isSubmitting}
        onPress={() => void submit()}
      />
      <FooterLink
        prompt={SIGN_UP_TEXT.footerPrompt}
        linkLabel={SIGN_UP_TEXT.footerLink}
        href="/sign-in"
      />
    </AppScreen>
  )
}
