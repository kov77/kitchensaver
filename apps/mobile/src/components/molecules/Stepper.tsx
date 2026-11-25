import { View } from 'react-native'

import { IconButton } from '@/components/atoms/IconButton'
import { Text } from '@/components/atoms/Text'

import { styles } from './Stepper.styles'

type StepperProps = {
  value: number
  min: number
  max: number
  label: string
  decreaseLabel: string
  increaseLabel: string
  isDisabled?: boolean
  onChange: (value: number) => void
}

const ACCESSIBILITY_ACTIONS = [{ name: 'increment' }, { name: 'decrement' }]

export function Stepper({
  value,
  min,
  max,
  label,
  decreaseLabel,
  increaseLabel,
  isDisabled = false,
  onChange,
}: StepperProps) {
  const canDecrease = !isDisabled && value > min
  const canIncrease = !isDisabled && value < max

  const handleAccessibilityAction = (actionName: string) => {
    if (actionName === 'increment' && canIncrease) onChange(value + 1)
    if (actionName === 'decrement' && canDecrease) onChange(value - 1)
  }

  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ min, max, now: value, text: String(value) }}
      accessibilityActions={ACCESSIBILITY_ACTIONS}
      onAccessibilityAction={({ nativeEvent }) =>
        handleAccessibilityAction(nativeEvent.actionName)
      }
      style={styles.row}
    >
      <IconButton
        icon="previous"
        accessibilityLabel={decreaseLabel}
        isDisabled={!canDecrease}
        onPress={() => onChange(value - 1)}
      />
      <Text variant="button" style={styles.value}>
        {value}
      </Text>
      <IconButton
        icon="next"
        accessibilityLabel={increaseLabel}
        isDisabled={!canIncrease}
        onPress={() => onChange(value + 1)}
      />
    </View>
  )
}
