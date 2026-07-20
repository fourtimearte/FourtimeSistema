import type { Config } from 'tailwindcss'

/**
 * Ponte de tokens: cada nome aqui aponta para uma CSS var de tokens.css.
 * Assim `bg-set-dtf` (Tailwind) === `background:var(--set-dtf)` (editor v172).
 * Fonte única da verdade continua sendo tokens.css — este preset só espelha.
 */
const preset: Partial<Config> = {
  theme: {
    extend: {
      colors: {
        'app': 'var(--bg-app)',
        'surface': 'var(--bg-surface)',
        'surface-2': 'var(--bg-surface-2)',
        'muted': 'var(--bg-muted)',
        'hover': 'var(--bg-hover)',
        'border-token': 'var(--border)',
        'border-strong': 'var(--border-strong)',
        'text-token': 'var(--text)',
        'text-muted': 'var(--text-muted)',
        'text-subtle': 'var(--text-subtle)',
        'primary': 'var(--primary)',
        'primary-hover': 'var(--primary-hover)',
        'primary-fg': 'var(--primary-fg)',
        'alert': 'var(--alert)',
        'alert-bg': 'var(--alert-bg)',
        'success': 'var(--success)',
        'success-bg': 'var(--success-bg)',
        'success-fg': 'var(--success-fg)',
        'info': 'var(--info)',
        'info-bg': 'var(--info-bg)',
        'info-fg': 'var(--info-fg)',
        'warning': 'var(--warning)',
        'warning-bg': 'var(--warning-bg)',
        'warning-fg': 'var(--warning-fg)',
        'danger': 'var(--danger)',
        'nav': 'var(--nav-bg)',
        'nav-fg': 'var(--nav-fg)',
        'nav-fg-strong': 'var(--nav-fg-strong)',
        // cores por setor (uma técnica = uma cor, igual editor + kanban)
        'set-comercial': 'var(--set-comercial)',
        'set-arte': 'var(--set-arte)',
        'set-dtf': 'var(--set-dtf)',
        'set-sublimacao': 'var(--set-sublimacao)',
        'set-silk': 'var(--set-silk)',
        'set-corte': 'var(--set-corte)',
        'set-bordado': 'var(--set-bordado)',
        'set-costura': 'var(--set-costura)',
        'set-embalagem': 'var(--set-embalagem)',
        'set-expedicao': 'var(--set-expedicao)',
        'set-estoque': 'var(--set-estoque)',
        'set-financeiro': 'var(--set-financeiro)',
      },
      fontFamily: {
        ui: 'var(--font-ui)',
        mono: 'var(--font-mono)',
        doc: 'var(--font-doc)',
      },
      borderRadius: {
        xs: '4px', sm: '6px', md: '8px', lg: '12px', xl: '16px',
      },
      boxShadow: {
        s1: 'var(--sh-1)', s2: 'var(--sh-2)', s3: 'var(--sh-3)', s4: 'var(--sh-4)',
      },
      backgroundImage: {
        'grad-brand': 'var(--grad-brand)',
      },
    },
  },
}

export default preset
