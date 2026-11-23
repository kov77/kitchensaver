export function apiError(status: number, code: string) {
  return {
    error: { code, message: 'Technical message', requestId: 'request-1' },
    response: new Response(null, { status }),
  } as never
}
