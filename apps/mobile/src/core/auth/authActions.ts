import { toAuthFailure } from './authFailure'
import { supabase } from './supabase'
import type { Credentials, SignInResult, SignUpResult } from './types'

export async function signIn(credentials: Credentials): Promise<SignInResult> {
  const { error } = await supabase.auth.signInWithPassword(credentials)
  if (error) return { ok: false, failure: toAuthFailure(error) }
  return { ok: true }
}

export async function signUp(credentials: Credentials): Promise<SignUpResult> {
  const { data, error } = await supabase.auth.signUp(credentials)
  if (error) return { ok: false, failure: toAuthFailure(error) }
  return { ok: true, emailConfirmationRequired: data.session === null }
}

export async function signOut() {
  await supabase.auth.signOut()
}
