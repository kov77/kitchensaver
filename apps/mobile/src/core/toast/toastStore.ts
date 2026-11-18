import { MAX_VISIBLE_TOASTS, TOAST_DURATION_MS } from '../constants'

export type ToastVariant = 'error' | 'info'

export type ToastMessage = {
  id: number
  message: string
  variant: ToastVariant
}

type ShowToastParams = {
  message: string
  variant?: ToastVariant
}

type Listener = () => void

let nextToastId = 1
let toasts: ToastMessage[] = []
const listeners = new Set<Listener>()

function setToasts(nextToasts: ToastMessage[]) {
  toasts = nextToasts
  listeners.forEach((listener) => listener())
}

export function getToasts() {
  return toasts
}

export function subscribeToToasts(listener: Listener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function dismissToast(id: number) {
  setToasts(toasts.filter((toast) => toast.id !== id))
}

export function showToast({ message, variant = 'info' }: ShowToastParams) {
  if (toasts.some((toast) => toast.message === message)) return

  const id = nextToastId
  nextToastId += 1
  setToasts([...toasts, { id, message, variant }].slice(-MAX_VISIBLE_TOASTS))
  setTimeout(() => dismissToast(id), TOAST_DURATION_MS)
}
