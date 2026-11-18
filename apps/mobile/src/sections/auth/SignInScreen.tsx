import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'

import { Button } from '@/components/atoms/Button'
import { FooterLink } from '@/components/molecules/FooterLink'
import { FormMessage } from '@/components/molecules/FormMessage'
import { ScreenHeader } from '@/components/molecules/ScreenHeader'
import { TextField } from '@/components/molecules/TextField'
import { AppScreen } from '@/components/templates/AppScreen'
import type { AuthFailure } from '@/core/auth/types'
import { useSession } from '@/core/auth/SessionProvider'

import { AUTH_FAILURE_MESSAGES, SIGN_IN_TEXT } from './constants'
import { signInSchema, type SignInValues } from './schemas'

export function SignInScreen() {
  const { signIn } = useSession()
  const [failure, setFailure] = useState<AuthFailure | null>(null)
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
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
        title={SIGN_IN_TEXT.title}
        subtitle={SIGN_IN_TEXT.subtitle}
      />
      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label={SIGN_IN_TEXT.emailLabel}
            errorMessage={errors.email?.message}
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
            keyboardType="email-address"
            placeholder={SIGN_IN_TEXT.emailPlaceholder}
            textContentType="emailAddress"
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
          />
        )}
      />
      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label={SIGN_IN_TEXT.passwordLabel}
            errorMessage={errors.password?.message}
            isPassword
            autoCapitalize="none"
            autoComplete="current-password"
            autoCorrect={false}
            textContentType="password"
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            onSubmitEditing={() => void submit()}
          />
        )}
      />
      {failure ? (
        <FormMessage message={AUTH_FAILURE_MESSAGES[failure]} />
      ) : null}
      <Button
        title={SIGN_IN_TEXT.submit}
        isLoading={isSubmitting}
        onPress={() => void submit()}
      />
      <FooterLink
        prompt={SIGN_IN_TEXT.footerPrompt}
        linkLabel={SIGN_IN_TEXT.footerLink}
        href="/sign-up"
      />
    </AppScreen>
  )
}
