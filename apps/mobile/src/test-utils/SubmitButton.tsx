import { Pressable, Text } from 'react-native'

export const SUBMIT_LABEL = 'Submit form'

export function SubmitButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={SUBMIT_LABEL}
      onPress={onPress}
    >
      <Text>{SUBMIT_LABEL}</Text>
    </Pressable>
  )
}
