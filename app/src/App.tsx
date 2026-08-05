import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ThemeProvider } from 'next-themes'
import { Shell } from '@/components/layout/Shell'
import { PrefsProvider } from '@/lib/prefs'
import { Kit } from '@/routes/kit/Fundamentos'
import { Clientes } from '@/routes/clientes/Clientes'
import { Dashboard } from '@/routes/dashboard/Dashboard'
import { Kanban } from '@/routes/kanban/Kanban'
import { EmBreve } from '@/routes/EmBreve'
import { MODULOS } from '@/lib/modulos'

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
      <PrefsProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Shell />}>
              <Route path="/kit" element={<Kit />} />
              <Route path="/" element={<Dashboard />} />
              <Route path="/clientes" element={<Clientes />} />
              <Route path="/kanban" element={<Kanban />} />
              {MODULOS.filter((m) => !['/kit', '/clientes', '/', '/kanban'].includes(m.rota)).map((m) => (
                <Route key={m.rota} path={m.rota} element={<EmBreve nome={m.nome} />} />
              ))}
            </Route>
          </Routes>
        </BrowserRouter>
      </PrefsProvider>
    </ThemeProvider>
  )
}
