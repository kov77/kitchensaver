import { Pressable, View } from 'react-native'

import { Text } from './Text'
import { CHECK_MARK } from './constants'
import { styles } from './Checkbox.styles'

type CheckboxProps = {
  label: string
  isChecked: boolean
  onChange: (isChecked: boolean) => void
}

export function Checkbox({ label, isChecked, onChange }: CheckboxProps) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked: isChecked }}
      onPress={() => onChange(!isChecked)}
      style={styles.row}
    >
      <View style={[styles.box, isChecked && styles.boxChecked]}>
        {isChecked ? (
          <Text variant="label" color="textOnBrand">
            {CHECK_MARK}
          </Text>
        ) : null}
      </View>
      <Text variant="body" style={styles.label}>
        {label}
      </Text>
    </Pressable>
  )
}
