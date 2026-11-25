import { colors } from './colors'

const MIN_TEXT_CONTRAST = 4.5
const MIN_BOUNDARY_CONTRAST = 3

function getLuminance(hex: string) {
  const [red = 0, green = 0, blue = 0] = [1, 3, 5].map((start) => {
    const channel = parseInt(hex.slice(start, start + 2), 16) / 255
    return channel <= 0.03928
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue
}

function getContrast(foreground: string, background: string) {
  const [lighter = 0, darker = 0] = [
    getLuminance(foreground),
    getLuminance(background),
  ].sort((first, second) => second - first)
  return (lighter + 0.05) / (darker + 0.05)
}

describe('text contrast', () => {
  it.each([
    ['primary button', colors.textOnBrand, colors.brandPrimary],
    ['danger button', colors.textOnBrand, colors.danger],
    ['removal cross', colors.danger, colors.dangerSoft],
    ['secondary button', colors.brandPrimary, colors.surfaceMuted],
    ['body text on a card', colors.text, colors.surface],
    ['body text on the screen', colors.text, colors.background],
    ['warning text on a card', colors.warning, colors.surface],
    ['error text on a card', colors.danger, colors.surface],
    ['error text on the screen', colors.danger, colors.background],
  ])('%s is readable', (_name, foreground, background) => {
    expect(getContrast(foreground, background)).toBeGreaterThanOrEqual(
      MIN_TEXT_CONTRAST,
    )
  })
})

describe('boundary contrast', () => {
  it.each([
    ['input border on a card', colors.border, colors.surface],
    ['input border on the screen', colors.border, colors.background],
    ['invalid input border on a card', colors.danger, colors.surface],
  ])('%s is visible', (_name, boundary, background) => {
    expect(getContrast(boundary, background)).toBeGreaterThanOrEqual(
      MIN_BOUNDARY_CONTRAST,
    )
  })
})
