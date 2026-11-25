import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import type { StoredBodyParameters } from '@/api/types'
import { Text } from '@/components/atoms/Text'
import { ACTIVITY_LEVEL_LABEL_KEYS, SEX_LABEL_KEYS } from '@/core/constants'
import { formatDisplayDate } from '@/utils/dates'

import { styles } from './PersonScreen.styles'

type BodyParametersSummaryProps = {
  parameters: StoredBodyParameters | null
}

export function BodyParametersSummary({
  parameters,
}: BodyParametersSummaryProps) {
  const { t } = useTranslation(['person', 'common'])

  if (!parameters) return <Text variant="body">{t('body-none')}</Text>

  const { heightCm, weightKg, activityLevel, formulaSex, updatedAt } =
    parameters

  return (
    <View style={styles.list}>
      <Text variant="body">{t('body-height-line', { value: heightCm })}</Text>
      <Text variant="body">{t('body-weight-line', { value: weightKg })}</Text>
      <Text variant="body">
        {t('body-activity-line', {
          value: t(ACTIVITY_LEVEL_LABEL_KEYS[activityLevel]),
        })}
      </Text>
      <Text variant="body">
        {t('body-sex-line', { value: t(SEX_LABEL_KEYS[formulaSex]) })}
      </Text>
      <Text variant="subtitle" color="textMuted">
        {t('body-updated-line', {
          date: formatDisplayDate(new Date(updatedAt)),
        })}
      </Text>
    </View>
  )
}
