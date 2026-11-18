import {
  Text as NativeText,
  type TextProps as NativeTextProps,
} from 'react-native'

import { colors } from '@/theme/colors'
import { typography } from '@/theme/typography'

type TextProps = NativeTextProps & {
  variant: keyof typeof typography
  color?: keyof typeof colors
}

export function Text({
  variant,
  color = 'text',
  style,
  ...textProps
}: TextProps) {
  return (
    <NativeText
      style={[typography[variant], { color: colors[color] }, style]}
      {...textProps}
    />
  )
}
