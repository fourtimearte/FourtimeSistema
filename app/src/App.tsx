import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ThemeProvider } from 'next-themes'
import { Shell } from '@/components/layout/Shell'
import { PrefsProvider } from '@/lib/prefs'
import { ToastProvider } from '@/components/fourtime/Toast'
import { Kit } from '@/routes/kit/Kit'
import { Clientes } from '@/routes/clientes/Clientes'
import { Dashboard } from '@/routes/dashboard/Dashboard'
import { Kanban } from '@/routes/kanban/Kanban'
import { Orcamentos } from '@/routes/orcamentos/Orcamentos'
import { EmBreve } from '@/routes/EmBreve'
import { PAGINAS } from '@/lib/modulos'

const PRONTAS = ['/', '/clientes', '/orcamentos', '/kanban', '/kit']

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
      <PrefsProvider>
        <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Shell />}>
              <Route path="/kit" element={<Kit />} />
              <Route path="/" element={<Dashboard />} />
              <Route path="/clientes" element={<Clientes />} />
              <Route path="/kanban" element={<Kanban />} />
              <Route path="/orcamentos" element={<Orcamentos />} />
              {/* toda página do menu vira rota. Sem isto, um item existe no
                  rail e leva a lugar nenhum — e ninguém descobre até clicar. */}
              {PAGINAS.filter((p) => !PRONTAS.includes(p.rota)).map((p) => (
                <Route key={p.rota} path={p.rota} element={<EmBreve nome={p.nome} />} />
              ))}
            </Route>
          </Routes>
        </BrowserRouter>
        </ToastProvider>
      </PrefsProvider>
    </ThemeProvider>
  )
}
