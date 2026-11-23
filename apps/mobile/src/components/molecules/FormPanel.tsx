import type { ReactNode } from 'react'

import { Button } from '@/components/atoms/Button'

type FormPanelProps = {
  isOpen: boolean
  openLabel: string
  cancelLabel: string
  onOpen: () => void
  onCancel: () => void
  children: ReactNode
}

export function FormPanel({
  isOpen,
  openLabel,
  cancelLabel,
  onOpen,
  onCancel,
  children,
}: FormPanelProps) {
  if (!isOpen) {
    return <Button title={openLabel} variant="secondary" onPress={onOpen} />
  }

  return (
    <>
      {children}
      <Button title={cancelLabel} variant="secondary" onPress={onCancel} />
    </>
  )
}
