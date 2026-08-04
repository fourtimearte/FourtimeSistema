/* =====================================================================
   Preferências do sistema (Configurações) — persistidas no navegador.
   Só guarda o que o usuário escolheu: o resto continua vindo dos tokens
   (tokens.css é a fonte da verdade; aqui só sobrescrevemos no <html>).
   ===================================================================== */
import { SETORES } from './model'

export interface Prefs {
  /** token --set-* → hex escolhido. Ausente = usa o padrão de fábrica. */
  cores: Record<string, string>
  tema: 'light' | 'dark'
  densidade: 'compact' | 'comfort'
  acento: 'on' | 'off'
}

const KEY = 'ft-prefs-v1'
export const PREFS_PADRAO: Prefs = { cores: {}, tema: 'light', densidade: 'compact', acento: 'on' }

export function carregarPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...PREFS_PADRAO, cores: {} }
    const p = JSON.parse(raw) as Partial<Prefs>
    return { ...PREFS_PADRAO, ...p, cores: { ...(p.cores ?? {}) } }
  } catch { return { ...PREFS_PADRAO, cores: {} } }
}

export function salvarPrefs(p: Prefs): void {
  /* navegação privada / storage cheio: só não persiste, nunca quebra a tela */
  try { localStorage.setItem(KEY, JSON.stringify(p)) } catch { /* noop */ }
}

/** joga as preferências no <html> — daí em diante é só CSS (var(--set-*)) */
export function aplicarPrefs(p: Prefs): void {
  const el = document.documentElement
  el.setAttribute('data-theme', p.tema)
  el.setAttribute('data-density', p.densidade)
  el.setAttribute('data-accent', p.acento)
  SETORES.forEach(s => {
    const hex = p.cores[s.token]
    /* igual ao padrão → remove a sobrescrita para o token voltar a valer
       (inclusive as variações que o tema escuro possa trazer no futuro) */
    if (hex && hex.toUpperCase() !== s.padrao.toUpperCase()) el.style.setProperty(s.token, hex)
    else el.style.removeProperty(s.token)
  })
}

/** cor efetiva de um setor (a escolhida ou a de fábrica) */
export function corSetor(p: Prefs, token: string): string {
  return p.cores[token] ?? SETORES.find(s => s.token === token)?.padrao ?? '#98A3B0'
}

/** aceita #RGB ou #RRGGBB e devolve sempre #RRGGBB maiúsculo (ou null) */
export function normalizaHex(v: string): string | null {
  const s = v.trim().replace(/^#?/, '#')
  if (/^#[0-9a-fA-F]{3}$/.test(s)) return ('#' + s[1] + s[1] + s[2] + s[2] + s[3] + s[3]).toUpperCase()
  if (/^#[0-9a-fA-F]{6}$/.test(s)) return s.toUpperCase()
  return null
}
