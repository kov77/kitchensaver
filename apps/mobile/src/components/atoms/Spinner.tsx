import { ActivityIndicator, type ActivityIndicatorProps } from 'react-native'
import { useTranslation } from 'react-i18next'

export function Spinner(props: ActivityIndicatorProps) {
  const { t } = useTranslation('common')

  return (
    <ActivityIndicator accessibilityLabel={t('spinner-label')} {...props} />
  )
}
