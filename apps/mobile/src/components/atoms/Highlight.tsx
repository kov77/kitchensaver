import { Text, type TextProps } from 'react-native'

import { colors } from '@/theme/colors'

export function Highlight({ style, ...textProps }: TextProps) {
  return <Text style={[{ color: colors.danger }, style]} {...textProps} />
}
