import { useState, type ReactNode } from 'react'
import {
  LayoutGrid, Briefcase, Users, Kanban, Layers, Box, Wallet, Search, Bell, Sun, Moon, Menu, X,
} from 'lucide-react'
import { useApp, type PageId } from '../store/useApp'
import Logo from './Logo'

/* ---------------------------------------------------------------------
   Shell — casca do sistema (topbar + rail + main).
   Visual 100% do Design Kit v5: as regras vivem em styles/kit.css
   (.topbar / .layout / .sidenav / .main), iguais às do HTML de clientes.
   Aqui não há mais CSS inline de aparência — só estrutura e estado.
   --------------------------------------------------------------------- */

interface NavItem { id: PageId; nome: string; icon: ReactNode; cor: string }
interface NavGroup { grupo: string; itens: NavItem[] }

const NAV: NavGroup[] = [
  { grupo: 'Início', itens: [{ id: 'dashboard', nome: 'Dashboard', icon: <LayoutGrid size={17} />, cor: '--primary' }] },
  { grupo: 'Atendimento', itens: [
    { id: 'comercial', nome: 'Comercial · Editor', icon: <Briefcase size={17} />, cor: '--set-comercial' },
    { id: 'crm', nome: 'CRM / Clientes', icon: <Users size={17} />, cor: '--set-comercial' },
  ] },
  { grupo: 'Produção', itens: [
    { id: 'producao', nome: 'Produção (Kanban)', icon: <Kanban size={17} />, cor: '--set-dtf' },
    { id: 'ficha', nome: 'Ficha Técnica (BOM)', icon: <Layers size={17} />, cor: '--set-estoque' },
  ] },
  { grupo: 'Materiais & Gestão', itens: [
    { id: 'estoque', nome: 'Estoque', icon: <Box size={17} />, cor: '--set-estoque' },
    { id: 'financeiro', nome: 'Financeiro', icon: <Wallet size={17} />, cor: '--set-financeiro' },
  ] },
]

export default function Shell({ children }: { children: ReactNode }) {
  const { page, goto, perfil, kcards, toast } = useApp()
  const [dark, setDark] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const av = perfil === 'Administração' ? 'AF' : perfil.slice(0, 2).toUpperCase()
  const nLate = kcards.filter(c => c.late).length
  const full = page === 'producao' // Kanban ocupa toda a tela (estilo Trello)
  const irPara = (id: PageId) => { goto(id); setMenuOpen(false) }

  const toggleTheme = () => {
    const d = document.documentElement.getAttribute('data-theme') === 'dark'
    document.documentElement.setAttribute('data-theme', d ? 'light' : 'dark'); setDark(!d)
  }

  return (
    <div className="app-root" style={{ minHeight: '100vh' }}>
      <header className="topbar">
        <button className="navbtn only-mobile" onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
          {menuOpen ? <X size={16} /> : <Menu size={16} />}
        </button>
        <div className="ft-logo"><Logo variant="light" height={22} /></div>
        <div className="ft-search">
          <Search size={15} />
          <input placeholder="Buscar pedido, cliente, PD####…"
            onKeyDown={e => { if (e.key === 'Enter' && (e.target as HTMLInputElement).value) toast('Busca (protótipo)') }} />
        </div>
        <div className="spacer" />
        <button className="navbtn" onClick={toggleTheme} aria-label="Tema">{dark ? <Sun size={16} /> : <Moon size={16} />}</button>
        <button className="navbtn" onClick={() => toast(nLate + ' card(s) atrasado(s)')} aria-label="Alertas"
          style={{ position: 'relative' }}>
          <Bell size={16} />
          {nLate > 0 && <span style={{ position: 'absolute', top: 4, right: 5, width: 7, height: 7, borderRadius: '50%', background: 'var(--primary)', border: '1.5px solid var(--nav-bg)' }} />}
        </button>
        <div className="ft-perfil"><span className="av">{av}</span>{perfil}</div>
      </header>

      {menuOpen && <div className="nav-scrim only-mobile" onClick={() => setMenuOpen(false)} />}

      <div className="layout">
        <nav className={'sidenav' + (menuOpen ? ' open' : '')}>
          {NAV.map(g => (
            <div key={g.grupo}>
              <div className="grp">{g.grupo}</div>
              {g.itens.map(it => (
                <button key={it.id} type="button"
                  className={'navlink' + (it.id === page ? ' on' : '')}
                  style={{ ['--acc' as string]: `var(${it.cor})` }}
                  onClick={() => irPara(it.id)}>
                  {it.icon}<span style={{ flex: 1 }}>{it.nome}</span>
                  {it.id === 'producao' && <span className="cnt">{kcards.filter(c => c.station !== 'entregue').length}</span>}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <main className={'main' + (full ? ' full' : '')}>
          <div className="play-surgir" key={page} style={full ? { height: '100%' } : undefined}>{children}</div>
        </main>
      </div>
    </div>
  )
}
