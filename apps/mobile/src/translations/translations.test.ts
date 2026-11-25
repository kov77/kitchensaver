import { en } from './en'
import { es } from './es'
import { fr } from './fr'

type Texts = Record<string, string>
type Locale = Record<string, Texts>

const PLACEHOLDER_PATTERN = /{{\w+}}/g
const TAG_PATTERN = /<\/?\w+>/g

const TRANSLATIONS: readonly (readonly [string, Locale])[] = [
  ['es', es],
  ['fr', fr],
]

function textsOf(locale: Locale, namespace: string): Texts {
  return locale[namespace] ?? {}
}

function listMarkers(text: string | undefined, pattern: RegExp) {
  return (text?.match(pattern) ?? []).sort().join()
}

function findMismatches(translation: Locale, pattern: RegExp) {
  return Object.entries(en).flatMap(([namespace, texts]) =>
    Object.entries(texts).filter(
      ([key, text]) =>
        listMarkers(textsOf(translation, namespace)[key], pattern) !==
        listMarkers(text, pattern),
    ),
  )
}

describe.each(TRANSLATIONS)('%s translation', (_locale, translation) => {
  it.each(Object.keys(en))('has the keys of %s in English', (namespace) => {
    expect(Object.keys(textsOf(translation, namespace)).sort()).toEqual(
      Object.keys(textsOf(en, namespace)).sort(),
    )
  })

  it('has no empty text', () => {
    const texts = Object.values(translation).flatMap((namespace) =>
      Object.values(namespace),
    )
    expect(texts.filter((text) => text.trim() === '')).toEqual([])
  })

  it('keeps the placeholders of the English text', () => {
    expect(findMismatches(translation, PLACEHOLDER_PATTERN)).toEqual([])
  })

  it('keeps the markup tags of the English text', () => {
    expect(findMismatches(translation, TAG_PATTERN)).toEqual([])
  })
})
