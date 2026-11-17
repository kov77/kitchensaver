import { StyleSheet, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { spacing } from '../theme/spacing'

export default function IndexScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text accessibilityRole="header">KitchenSaver</Text>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.xl,
  },
})
