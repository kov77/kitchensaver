import { useMemo, useState } from 'react'

export function useOpen(initialValue = false) {
  const [isOpen, setIsOpen] = useState(initialValue)

  const actions = useMemo(
    () => ({
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      toggle: () => setIsOpen((current) => !current),
    }),
    [],
  )

  return [isOpen, actions] as const
}

export function useOpenValue<Value>() {
  const [value, setValue] = useState<Value | null>(null)

  const actions = useMemo(
    () => ({
      open: (nextValue: Value) => setValue(nextValue),
      close: () => setValue(null),
    }),
    [],
  )

  return [value, actions] as const
}
