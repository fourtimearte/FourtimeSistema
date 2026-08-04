import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ThemeProvider } from 'next-themes'
import { Shell } from '@/components/layout/Shell'
import { PrefsProvider } from '@/lib/prefs'
import { Kit } from '@/routes/kit/Fundamentos'
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
              {MODULOS.filter((m) => m.rota !== '/kit').map((m) => (
                <Route key={m.rota} path={m.rota} element={<EmBreve nome={m.nome} />} />
              ))}
            </Route>
          </Routes>
        </BrowserRouter>
      </PrefsProvider>
    </ThemeProvider>
  )
}
