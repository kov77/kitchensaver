import { ActivityIndicator, type ActivityIndicatorProps } from 'react-native'

import { SPINNER_LABEL } from './constants'

export function Spinner(props: ActivityIndicatorProps) {
  return <ActivityIndicator accessibilityLabel={SPINNER_LABEL} {...props} />
}
