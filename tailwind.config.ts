import type { Config } from 'tailwindcss'

/**
 * M3 Design Tokens – Tailwind theme extension.
 * Primary: Royal Gold #D4AF37
 * Surface: Dark Charcoal (dark mode)
 * Rounding: extra-large 24px
 * Values reference CSS variables from app/globals.css (single source of truth).
 */
const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        'on-primary': 'var(--color-on-primary)',
        background: 'var(--color-background)',
        'on-background': 'var(--color-on-background)',
        surface: 'var(--color-surface)',
        'on-surface': 'var(--color-on-surface)',
        'on-surface-variant': 'var(--color-on-surface-variant)',
        outline: 'var(--color-outline)',
        'outline-variant': 'var(--color-outline-variant)',
        error: 'var(--color-error)',
        'on-error': 'var(--color-on-error)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
      },
      borderRadius: {
        'extra-large': 'var(--radius-extra-large)', /* 24px */
        'radius-sm': 'var(--radius-sm)',
        'radius-md': 'var(--radius-md)',
        'radius-lg': 'var(--radius-lg)',
      },
      fontFamily: {
        sans: ['var(--font-system)'],
        mono: ['var(--font-mono)'],
      },
      fontSize: {
        'display-large': ['var(--md-sys-typescale-display-large-size)', { lineHeight: 'var(--md-sys-typescale-display-large-line-height)' }],
        'display-medium': ['var(--md-sys-typescale-display-medium-size)', { lineHeight: 'var(--md-sys-typescale-display-medium-line-height)' }],
        'display-small': ['var(--md-sys-typescale-display-small-size)', { lineHeight: 'var(--md-sys-typescale-display-small-line-height)' }],
        'headline-large': ['var(--md-sys-typescale-headline-large-size)', { lineHeight: 'var(--md-sys-typescale-headline-large-line-height)' }],
        'headline-medium': ['var(--md-sys-typescale-headline-medium-size)', { lineHeight: 'var(--md-sys-typescale-headline-medium-line-height)' }],
        'headline-small': ['var(--md-sys-typescale-headline-small-size)', { lineHeight: 'var(--md-sys-typescale-headline-small-line-height)' }],
        'title-large': ['var(--md-sys-typescale-title-large-size)', { lineHeight: 'var(--md-sys-typescale-title-large-line-height)' }],
        'title-medium': ['var(--md-sys-typescale-title-medium-size)', { lineHeight: 'var(--md-sys-typescale-title-medium-line-height)' }],
        'title-small': ['var(--md-sys-typescale-title-small-size)', { lineHeight: 'var(--md-sys-typescale-title-small-line-height)' }],
        'body-large': ['var(--md-sys-typescale-body-large-size)', { lineHeight: 'var(--md-sys-typescale-body-large-line-height)' }],
        'body-medium': ['var(--md-sys-typescale-body-medium-size)', { lineHeight: 'var(--md-sys-typescale-body-medium-line-height)' }],
        'body-small': ['var(--md-sys-typescale-body-small-size)', { lineHeight: 'var(--md-sys-typescale-body-small-line-height)' }],
        'label-large': ['var(--md-sys-typescale-label-large-size)', { lineHeight: 'var(--md-sys-typescale-label-large-line-height)' }],
        'label-medium': ['var(--md-sys-typescale-label-medium-size)', { lineHeight: 'var(--md-sys-typescale-label-medium-line-height)' }],
        'label-small': ['var(--md-sys-typescale-label-small-size)', { lineHeight: 'var(--md-sys-typescale-label-small-line-height)' }],
      },
      spacing: {
        'main': 'var(--main-padding)',
        'section': 'var(--section-padding)',
        'element': 'var(--element-gap)',
      },
    },
  },
  plugins: [],
}

export default config
