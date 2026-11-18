import type { TextStyle } from 'react-native'

export const typography = {
  title: { fontSize: 29, fontWeight: '700' },
  subtitle: { fontSize: 14, fontWeight: '400' },
  label: { fontSize: 12, fontWeight: '700' },
  input: { fontSize: 15, fontWeight: '500' },
  button: { fontSize: 15, fontWeight: '700' },
  link: { fontSize: 12, fontWeight: '500' },
  body: { fontSize: 15, fontWeight: '400' },
} satisfies Record<string, TextStyle>
