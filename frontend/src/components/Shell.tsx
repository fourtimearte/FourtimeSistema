import { useState, type ReactNode } from 'react'
import {
  LayoutGrid, Briefcase, Users, Kanban, Layers, Box, Wallet, Search, Bell, Sun, Moon, Menu, X,
} from 'lucide-react'
import { useApp, type PageId } from '../store/useApp'
import Logo from './Logo'

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
  const fullBleed = page === 'producao' // Kanban ocupa toda a tela (estilo Trello)
  const irPara = (id: PageId) => { goto(id); setMenuOpen(false) } // navegar fecha o menu mobile

  const toggleTheme = () => {
    const d = document.documentElement.getAttribute('data-theme') === 'dark'
    document.documentElement.setAttribute('data-theme', d ? 'light' : 'dark'); setDark(!d)
  }

  return (
    <div className="app-root" style={{ minHeight: '100vh' }}>
      <header style={topbar} className="ft-topbar">
        <button className="only-mobile" onClick={() => setMenuOpen(o => !o)} style={{ ...iconBtnNav, marginRight: 2, flex: '0 0 auto' }} aria-label="Menu">{menuOpen ? <X size={18} /> : <Menu size={18} />}</button>
        <div className="ft-logo" style={{ display: 'flex', alignItems: 'center', paddingLeft: 2, minWidth: 0 }}><Logo variant="light" height={22} /></div>
        <div style={{ flex: 1 }} />
        <div style={search} className="ft-search"><Search size={15} /><input placeholder="Buscar pedido, cliente, PD####…" style={searchInput} onKeyDown={e => { if (e.key === 'Enter' && (e.target as HTMLInputElement).value) toast('Busca (protótipo)') }} /></div>
        <button style={iconBtnNav} onClick={toggleTheme}>{dark ? <Sun size={17} /> : <Moon size={17} />}</button>
        <button style={iconBtnNav} onClick={() => toast(nLate + ' card(s) atrasado(s)')}><Bell size={17} /><span style={dot} /></button>
        <div style={userchip}><div style={avatar}>{av}</div><small className="ft-perfil" style={{ fontSize: 12, color: 'var(--nav-fg)' }}>{perfil}</small></div>
      </header>

      {menuOpen && <div className="only-mobile" onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: '56px 0 0 0', background: 'rgba(10,12,16,.5)', zIndex: 44 }} />}
      <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', alignItems: 'start' }} className="ft-layout">
        <nav className={'sidenav' + (menuOpen ? ' open' : '')} style={sidenav}>
          {NAV.map(g => (
            <div key={g.grupo}>
              <div style={grp}>{g.grupo}</div>
              {g.itens.map(it => {
                const on = it.id === page
                let cnt: ReactNode = null
                if (it.id === 'producao') cnt = <span style={cntBadge}>{kcards.filter(c => c.station !== 'entregue').length}</span>
                return (
                  <button key={it.id} onClick={() => irPara(it.id)}
                    style={{ ...navItem, ...(on ? { background: `linear-gradient(90deg,color-mix(in srgb,var(${it.cor}) 34%,transparent),transparent)`, color: '#fff', boxShadow: `inset 3px 0 0 var(${it.cor})` } : {}) }}>
                    {it.icon}<span style={{ flex: 1, textAlign: 'left' }}>{it.nome}</span>{cnt}
                  </button>
                )
              })}
            </div>
          ))}
        </nav>
        <main style={fullBleed
          ? { padding: 0, maxWidth: 'none', height: 'calc(100vh - 56px)', overflow: 'hidden', minWidth: 0 }
          : { padding: '32px 40px', maxWidth: 1280, minHeight: 'calc(100vh - 56px)', minWidth: 0 }} className={'ft-main' + (fullBleed ? ' ft-main-full' : '')}>
          <div className="play-surgir" key={page} style={fullBleed ? { height: '100%' } : undefined}>{children}</div>
        </main>
      </div>
      <style>{`
        .only-mobile{display:none!important}
        @media(max-width:980px){.ft-layout{grid-template-columns:1fr!important}.sidenav{position:fixed!important;left:0;top:56px;bottom:0;height:auto!important;width:min(280px,82vw);z-index:45;transform:translateX(-100%)!important;transition:transform .2s var(--ease);box-shadow:var(--sh-4)}.sidenav.open{transform:none!important}.only-mobile{display:inline-grid!important}}
        @media(max-width:640px){.ft-main:not(.ft-main-full){padding:20px!important}}
        @media(max-width:760px){.ft-search{display:none!important}}
        @media(max-width:520px){.ft-perfil{display:none!important}.ft-topbar{padding:0 10px!important;gap:8px!important}.ft-logo img{height:19px!important}}
      `}</style>
    </div>
  )
}

const topbar: React.CSSProperties = { position: 'sticky', top: 0, zIndex: 40, display: 'flex', alignItems: 'center', gap: 12, height: 56, padding: '0 24px', background: 'var(--nav-bg)', borderBottom: '1px solid var(--nav-border)', color: 'var(--nav-fg-strong)' }
const logo: React.CSSProperties = { width: 32, height: 32, borderRadius: 8, background: 'var(--grad-brand)', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 15 }
const search: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,.05)', border: '1px solid var(--nav-border)', borderRadius: 8, padding: '0 10px', height: 36, width: 280, color: 'var(--nav-fg)' }
const searchInput: React.CSSProperties = { background: 'none', border: 'none', outline: 'none', color: 'var(--nav-fg-strong)', font: 'inherit', fontSize: 13, width: '100%' }
const iconBtnNav: React.CSSProperties = { position: 'relative', width: 36, height: 36, display: 'inline-grid', placeItems: 'center', borderRadius: 8, border: '1px solid var(--nav-border)', background: 'rgba(255,255,255,.04)', color: 'var(--nav-fg)', cursor: 'pointer' }
const dot: React.CSSProperties = { position: 'absolute', top: 6, right: 7, width: 7, height: 7, borderRadius: '50%', background: 'var(--primary)', border: '1.5px solid var(--nav-bg)' }
const userchip: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, padding: '0 8px 0 4px', height: 36, borderRadius: 999, border: '1px solid var(--nav-border)', background: 'rgba(255,255,255,.04)' }
const avatar: React.CSSProperties = { width: 26, height: 26, borderRadius: '50%', background: 'var(--grad-brand)', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 11 }
const sidenav: React.CSSProperties = { position: 'sticky', top: 56, alignSelf: 'start', height: 'calc(100vh - 56px)', overflow: 'auto', padding: '16px 12px 32px', background: 'var(--nav-bg)', borderRight: '1px solid var(--nav-border)', color: 'var(--nav-fg)' }
const grp: React.CSSProperties = { fontSize: 11, fontWeight: 600, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--nav-group)', padding: '20px 8px 6px' }
const navItem: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 11, padding: '8px 11px', borderRadius: 8, fontSize: 13, fontWeight: 500, color: 'var(--nav-fg)', minHeight: 36, cursor: 'pointer', border: 'none', background: 'none', width: '100%', fontFamily: 'inherit' }
const cntBadge: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontSize: 10, background: 'var(--primary)', color: '#fff', borderRadius: 999, padding: '1px 7px', fontWeight: 600 }
