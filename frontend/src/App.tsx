import { useApp } from './store/useApp'
import Login from './components/Login'
import Shell from './components/Shell'
import Toasts from './components/Toasts'
import Dashboard from './pages/Dashboard'
import Kanban from './pages/Kanban'
import Comercial from './pages/Comercial'
import CRM from './pages/CRM'
import BOM from './pages/BOM'
import Estoque from './pages/Estoque'
import Financeiro from './pages/Financeiro'
import Configuracoes from './pages/Configuracoes'
import PrintDoc from './components/PrintDoc'

export default function App() {
  const { logged, page } = useApp()
  if (!logged) return <><Login /><Toasts /></>
  return (
    <>
      <Shell>
        {page === 'dashboard' && <Dashboard />}
        {page === 'producao' && <Kanban />}
        {page === 'comercial' && <Comercial />}
        {page === 'crm' && <CRM />}
        {page === 'ficha' && <BOM />}
        {page === 'estoque' && <Estoque />}
        {page === 'financeiro' && <Financeiro />}
        {page === 'configuracoes' && <Configuracoes />}
      </Shell>
      <Toasts />
      <PrintDoc />
    </>
  )
}
