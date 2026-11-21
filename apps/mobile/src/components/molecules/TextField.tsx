import { useState } from 'react'
import { Pressable, View, type TextInputProps } from 'react-native'
import { useTranslation } from 'react-i18next'

import { Input } from '@/components/atoms/Input'
import { Text } from '@/components/atoms/Text'
import { spacing } from '@/theme/spacing'

import { styles } from './TextField.styles'

type TextFieldProps = TextInputProps & {
  label: string
  errorMessage?: string
  isPassword?: boolean
}

export function TextField({
  label,
  errorMessage,
  isPassword = false,
  ...inputProps
}: TextFieldProps) {
  const { t } = useTranslation('common')
  const [isHidden, setIsHidden] = useState(true)
  const toggleLabel = isHidden
    ? t('password-toggle-labels-show')
    : t('password-toggle-labels-hide')
  const toggleText = isHidden
    ? t('password-toggle-show')
    : t('password-toggle-hide')

  return (
    <View style={styles.container}>
      <Text variant="label" color="textMuted">
        {label}
      </Text>
      <Input
        accessibilityLabel={label}
        secureTextEntry={isPassword && isHidden}
        accessory={
          isPassword ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={toggleLabel}
              hitSlop={spacing.sm}
              onPress={() => setIsHidden((previous) => !previous)}
              style={styles.toggle}
            >
              <Text variant="label" color="brandPrimary">
                {toggleText}
              </Text>
            </Pressable>
          ) : null
        }
        {...inputProps}
      />
      {errorMessage ? (
        <Text variant="link" color="warning" accessibilityLiveRegion="polite">
          {errorMessage}
        </Text>
      ) : null}
    </View>
  )
}
