import { Roboto_400Regular } from '@expo-google-fonts/roboto/400Regular'
import { Roboto_500Medium } from '@expo-google-fonts/roboto/500Medium'
import { Roboto_700Bold } from '@expo-google-fonts/roboto/700Bold'

export const fontFamily = {
  regular: 'Roboto_400Regular',
  medium: 'Roboto_500Medium',
  bold: 'Roboto_700Bold',
} as const

export const fontFiles = {
  [fontFamily.regular]: Roboto_400Regular,
  [fontFamily.medium]: Roboto_500Medium,
  [fontFamily.bold]: Roboto_700Bold,
}
