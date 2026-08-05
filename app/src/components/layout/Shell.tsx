import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useTheme } from 'next-themes'
import { Menu, Search, Moon, Sun, Rows3, Rows4, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { MODULOS, GRUPOS } from '@/lib/modulos'
import { usePrefs } from '@/lib/prefs'
import { cn } from '@/lib/utils'

export function Shell() {
  const [mini, setMini] = useState(false)
  /* No celular o rail não encolhe, ele SAI: 232px de menu num aparelho de
     390px deixa 158px de conteúdo, e o sistema é usado no galpão. */
  const [gaveta, setGaveta] = useState(false)
  const rota = useLocation().pathname
  useEffect(() => setGaveta(false), [rota])
  const { theme, setTheme } = useTheme()
  const { densidade, setDensidade } = usePrefs()
  const escuro = theme === 'dark'
  const compacta = densidade === 'compacta'

  return (
    <div className="layout-grid grid min-h-svh grid-cols-1 md:grid-cols-[auto_1fr]">
      {gaveta && (
        <div className="bg-background/70 fixed inset-0 z-40 md:hidden" onClick={() => setGaveta(false)} aria-hidden />
      )}

      {/* ---------- rail ---------- */}
      <nav
        aria-label="Módulos"
        className={cn(
          'bg-sidebar border-sidebar-border fixed inset-y-0 left-0 z-50 flex w-[232px] flex-col border-r transition-transform duration-200',
          'md:static md:z-auto md:translate-x-0 md:transition-[width]',
          gaveta ? 'translate-x-0' : '-translate-x-full',
          mini ? 'md:w-[60px]' : 'md:w-[232px]',
        )}
      >
        <div className="border-sidebar-border flex h-14 items-center gap-2.5 border-b px-3.5">
          <div className="bg-chart-3 grid size-7 shrink-0 place-items-center rounded-lg font-heading text-[13px] font-bold text-white">
            F
          </div>
          <span className={cn('font-heading truncate text-sm font-semibold', mini && 'md:hidden')}>Fourtime</span>
          <button
            onClick={() => setMini((m) => !m)}
            aria-label={mini ? 'Expandir menu' : 'Recolher menu'}
            className="hover:bg-sidebar-accent ml-auto hidden size-7 shrink-0 place-items-center rounded-md md:grid"
          >
            <Menu className="size-4" />
          </button>
          <button
            onClick={() => setGaveta(false)}
            aria-label="Fechar menu"
            className="hover:bg-sidebar-accent ml-auto grid size-7 shrink-0 place-items-center rounded-md md:hidden"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
          {GRUPOS.map((grupo) => (
            <div key={grupo} className="contents">
              <div
                className={cn(
                  'text-muted-foreground px-2.5 pt-3 pb-1 text-[10px] font-semibold tracking-[0.08em] uppercase',
                  mini && 'md:hidden',
                )}
              >
                {grupo}
              </div>
              {MODULOS.filter((m) => m.grupo === grupo).map((m) => (
                <NavLink
                  key={m.rota}
                  to={m.rota}
                  end={m.rota === '/'}
                  title={mini ? m.nome : undefined}
                  className={({ isActive }) =>
                    cn(
                      'text-sidebar-foreground flex h-(--ft-control-h) items-center gap-2.5 rounded-lg px-2.5 text-[13px] font-medium whitespace-nowrap transition-colors',
                      'hover:bg-sidebar-accent',
                      isActive && 'bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary',
                    )
                  }
                >
                  <m.icone className="size-[17px] shrink-0" />
                  <span className={cn('truncate', mini && 'md:hidden')}>{m.nome}</span>
                  {m.cor && (
                    <span
                      className={cn('ml-auto size-[7px] shrink-0 rounded-full', mini && 'md:hidden')}
                      style={{ background: m.cor }}
                    />
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </div>

        <div className="border-sidebar-border border-t p-2">
          <div className="flex items-center gap-2.5 px-2.5 py-1.5">
            <div className="bg-secondary grid size-7 shrink-0 place-items-center rounded-full text-[11px] font-semibold">
              HF
            </div>
            <div className={cn('min-w-0', mini && 'md:hidden')}>
              <div className="truncate text-xs font-semibold">Henrique</div>
              <div className="text-muted-foreground truncate text-[11px]">Administração</div>
            </div>
          </div>
        </div>
      </nav>

      {/* ---------- conteúdo ---------- */}
      <div className="flex min-w-0 flex-col overflow-x-clip">
        <header className="bg-card sticky top-0 z-30 flex h-14 items-center gap-2.5 border-b px-4">
          <button
            onClick={() => setGaveta(true)}
            aria-label="Abrir menu"
            className="hover:bg-accent grid size-8 shrink-0 place-items-center rounded-md md:hidden"
          >
            <Menu className="size-[18px]" />
          </button>
          <div className="relative max-w-[420px] flex-1">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-[15px] -translate-y-1/2" />
            <input
              aria-label="Busca global"
              placeholder="Buscar pedido PD####, cliente, referência…"
              className="border-input bg-background focus-visible:ring-ring h-(--ft-control-h) w-full rounded-lg border pl-8 text-[13px] outline-none focus-visible:ring-2"
            />
          </div>
          <div className="flex-1" />
          <span className="text-muted-foreground hidden items-center gap-1.5 text-xs sm:flex">
            <span className="bg-success size-[7px] rounded-full" /> sincronizado
          </span>
          <BotaoTopo
            onClick={() => setDensidade(compacta ? 'confortavel' : 'compacta')}
            icone={compacta ? <Rows4 className="size-[15px]" /> : <Rows3 className="size-[15px]" />}
            rotulo={compacta ? 'Compacta' : 'Confortável'}
          />
          <BotaoTopo
            onClick={() => setTheme(escuro ? 'light' : 'dark')}
            icone={escuro ? <Moon className="size-[15px]" /> : <Sun className="size-[15px]" />}
            rotulo={escuro ? 'Escuro' : 'Claro'}
          />
        </header>

        <main className="flex flex-col gap-(--ft-gap) p-(--ft-gap) pb-12">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function BotaoTopo({ onClick, icone, rotulo }: { onClick: () => void; icone: React.ReactNode; rotulo: string }) {
  return (
    <button
      onClick={onClick}
      className="hover:bg-accent flex h-(--ft-control-h) items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-colors"
    >
      {icone}
      <span className="hidden md:inline">{rotulo}</span>
    </button>
  )
}
