import { Link, type Href } from 'expo-router'
import { Pressable } from 'react-native'

import { Text } from '@/components/atoms/Text'

import { styles } from './FooterLink.styles'

type FooterLinkProps = {
  prompt: string
  linkLabel: string
  href: Href
}

export function FooterLink({ prompt, linkLabel, href }: FooterLinkProps) {
  return (
    <Link asChild href={href}>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`${prompt} ${linkLabel}`}
        style={styles.container}
      >
        <Text variant="link" color="textMuted">
          {prompt}{' '}
          <Text variant="label" color="brandPrimary">
            {linkLabel}
          </Text>
        </Text>
      </Pressable>
    </Link>
  )
}
