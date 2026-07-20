import { useState } from 'react'
import { useApp } from '../store/useApp'
import { Btn } from './ui'

const PERFIS = ['Administração', 'Comercial', 'Arte', 'Produção']

export default function Login() {
  const login = useApp(s => s.login)
  const [perfil, setPerfil] = useState('Administração')
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'grid', placeItems: 'center', background: 'radial-gradient(1100px 620px at 78% -8%,rgba(198,22,27,.22),transparent 60%),var(--bg-app)', padding: 20 }}>
      <div className="play-subir" style={{ width: '100%', maxWidth: 400, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, boxShadow: 'var(--sh-4)', padding: '32px 30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 22 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--grad-brand)', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 20, boxShadow: '0 6px 18px rgba(198,22,27,.4)' }}>F</div>
          <div><b style={{ fontSize: 18 }}>Fourtime</b><div style={{ color: 'var(--text-muted)', fontSize: 12 }}>Sistema CRM + ERP + Produção</div></div>
        </div>
        <h1 style={{ fontSize: 20, marginBottom: 4 }}>Entrar</h1>
        <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>Acesse o painel de gestão da fábrica.</div>
        <Field label="E-mail"><input className="ft-input" defaultValue="arte@fourtimefit.com.br" /></Field>
        <Field label="Senha"><input className="ft-input" type="password" defaultValue="********" /></Field>
        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Entrar como</div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
          {PERFIS.map(p => (
            <button key={p} onClick={() => setPerfil(p)} style={{ fontSize: 11, fontWeight: 600, padding: '5px 10px', borderRadius: 999, cursor: 'pointer',
              border: '1px solid ' + (p === perfil ? 'var(--primary)' : 'var(--border-strong)'), background: p === perfil ? 'var(--primary)' : 'var(--bg-surface)', color: p === perfil ? 'var(--primary-fg)' : 'var(--text-muted)' }}>{p}</button>
          ))}
        </div>
        <Btn variant="primary" size="lg" onClick={() => login(perfil)}>Entrar no painel</Btn>
        <div style={{ fontSize: 11, color: 'var(--text-subtle)', textAlign: 'center', marginTop: 14 }}>Protótipo — login fictício, qualquer credencial entra.</div>
      </div>
      <style>{`.ft-input{height:var(--control-h-lg);padding:0 14px;border:1px solid var(--border-strong);border-radius:8px;background:var(--bg-surface);color:var(--text);font:inherit;font-size:13px;outline:none;width:100%}.ft-input:focus{border-color:var(--focus);box-shadow:0 0 0 3px var(--ring)}`}</style>
    </div>
  )
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}><label style={{ fontSize: 12, fontWeight: 600 }}>{label}</label>{children}</div>
}
