import type { TextStyle } from 'react-native'

import { fontFamily } from './fonts'

export const typography = {
  title: { fontSize: 29, fontFamily: fontFamily.bold },
  subtitle: { fontSize: 14, fontFamily: fontFamily.regular },
  label: { fontSize: 12, fontFamily: fontFamily.bold },
  input: { fontSize: 15, fontFamily: fontFamily.medium },
  button: { fontSize: 15, fontFamily: fontFamily.bold },
  link: { fontSize: 12, fontFamily: fontFamily.medium },
  body: { fontSize: 15, fontFamily: fontFamily.regular },
} satisfies Record<string, TextStyle>
