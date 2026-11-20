export function apiResult(status: number, data?: unknown) {
  return { data, response: new Response(null, { status }) } as never
}
