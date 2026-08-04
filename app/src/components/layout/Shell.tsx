import { NavLink, Outlet } from 'react-router-dom'
import { useTheme } from 'next-themes'
import { Menu, Search, Moon, Sun, Rows3, Rows4 } from 'lucide-react'
import { useState } from 'react'
import { MODULOS, GRUPOS } from '@/lib/modulos'
import { usePrefs } from '@/lib/prefs'
import { cn } from '@/lib/utils'

export function Shell() {
  const [mini, setMini] = useState(false)
  const { theme, setTheme } = useTheme()
  const { densidade, setDensidade } = usePrefs()
  const escuro = theme === 'dark'
  const compacta = densidade === 'compacta'

  return (
    <div className="layout-grid grid min-h-svh grid-cols-[auto_1fr]">
      {/* ---------- rail ---------- */}
      <nav
        aria-label="Módulos"
        className={cn(
          'bg-sidebar border-sidebar-border flex flex-col border-r transition-[width] duration-200',
          mini ? 'w-[60px]' : 'w-[232px]',
        )}
      >
        <div className="border-sidebar-border flex h-14 items-center gap-2.5 border-b px-3.5">
          <div className="bg-chart-3 grid size-7 shrink-0 place-items-center rounded-lg font-heading text-[13px] font-bold text-white">
            F
          </div>
          {!mini && <span className="font-heading truncate text-sm font-semibold">Fourtime</span>}
          <button
            onClick={() => setMini((m) => !m)}
            aria-label={mini ? 'Expandir menu' : 'Recolher menu'}
            className="hover:bg-sidebar-accent ml-auto grid size-7 shrink-0 place-items-center rounded-md"
          >
            <Menu className="size-4" />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
          {GRUPOS.map((grupo) => (
            <div key={grupo} className="contents">
              {!mini && (
                <div className="text-muted-foreground px-2.5 pt-3 pb-1 text-[10px] font-semibold tracking-[0.08em] uppercase">
                  {grupo}
                </div>
              )}
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
                  {!mini && <span className="truncate">{m.nome}</span>}
                  {!mini && m.cor && (
                    <span className="ml-auto size-[7px] shrink-0 rounded-full" style={{ background: m.cor }} />
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
            {!mini && (
              <div className="min-w-0">
                <div className="truncate text-xs font-semibold">Henrique</div>
                <div className="text-muted-foreground truncate text-[11px]">Administração</div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ---------- conteúdo ---------- */}
      <div className="flex min-w-0 flex-col overflow-x-clip">
        <header className="bg-card sticky top-0 z-40 flex h-14 items-center gap-2.5 border-b px-4">
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
