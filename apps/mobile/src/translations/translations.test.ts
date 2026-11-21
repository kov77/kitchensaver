import { en } from './en'
import { es } from './es'
import { fr } from './fr'

const PLACEHOLDER_PATTERN = /{{\w+}}/g

const TRANSLATIONS = [
  ['es', es],
  ['fr', fr],
] as const

describe.each(TRANSLATIONS)('%s translation', (_locale, translation) => {
  it.each(Object.keys(en))('has the keys of %s in English', (namespace) => {
    const reference = en[namespace as keyof typeof en]
    const actual = translation[namespace as keyof typeof en]
    expect(Object.keys(actual).sort()).toEqual(Object.keys(reference).sort())
  })

  it('has no empty text', () => {
    const texts = Object.values(translation).flatMap((namespace) =>
      Object.values(namespace),
    )
    expect(texts.filter((text) => text.trim() === '')).toEqual([])
  })

  it('keeps the placeholders of the English text', () => {
    const mismatches = Object.entries(en).flatMap(([namespace, texts]) =>
      Object.entries(texts).filter(([key, text]) => {
        const translated = (
          translation[namespace as keyof typeof en] as Record<string, string>
        )[key]
        return (
          (translated?.match(PLACEHOLDER_PATTERN) ?? []).sort().join() !==
          (text.match(PLACEHOLDER_PATTERN) ?? []).sort().join()
        )
      }),
    )
    expect(mismatches).toEqual([])
  })
})
