import { randomUUID } from 'expo-crypto'
import { useRef } from 'react'

type Attempt = { fingerprint: string; key: string }

export function useAttemptKey() {
  const attempt = useRef<Attempt | null>(null)

  return (fingerprint: string) => {
    if (attempt.current?.fingerprint !== fingerprint) {
      attempt.current = { fingerprint, key: randomUUID() }
    }
    return attempt.current.key
  }
}
