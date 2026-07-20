import { useApp } from './store/useApp'
import Login from './components/Login'
import Shell from './components/Shell'
import Toasts from './components/Toasts'
import Dashboard from './pages/Dashboard'
import Kanban from './pages/Kanban'
import Stub from './pages/Stub'

export default function App() {
  const { logged, page } = useApp()
  if (!logged) return <><Login /><Toasts /></>
  return (
    <>
      <Shell>
        {page === 'dashboard' && <Dashboard />}
        {page === 'producao' && <Kanban />}
        {page === 'comercial' && <Stub id="comercial" />}
        {page === 'crm' && <Stub id="crm" />}
        {page === 'ficha' && <Stub id="ficha" />}
        {page === 'estoque' && <Stub id="estoque" />}
        {page === 'financeiro' && <Stub id="financeiro" />}
      </Shell>
      <Toasts />
    </>
  )
}
