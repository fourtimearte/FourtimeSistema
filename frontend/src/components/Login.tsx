import { useState } from 'react'
import { useApp } from '../store/useApp'
import { Btn } from './ui'

const PERFIS = ['Administração', 'Comercial', 'Arte', 'Produção']

export default function Login() {
  const login = useApp(s => s.login)
  const [perfil, setPerfil] = useState('Administração')
  return (
    <div className="loginwrap">
      <div className="logincard play-subir">
        <div className="lg-brand">
          <div className="mark">F</div>
          <div><b>Fourtime</b><small>Sistema CRM + ERP + Produção</small></div>
        </div>
        <h1>Entrar</h1>
        <div className="lg-sub">Acesse o painel de gestão da fábrica.</div>

        <div className="field"><label htmlFor="lg-mail">E-mail</label>
          <input id="lg-mail" className="input" defaultValue="arte@fourtimefit.com.br" /></div>
        <div className="field"><label htmlFor="lg-pw">Senha</label>
          <input id="lg-pw" className="input" type="password" defaultValue="********" /></div>

        <div className="field">
          <label>Entrar como</label>
          <div className="chipset">
            {PERFIS.map(p => (
              <button key={p} type="button" className={'chip' + (p === perfil ? ' on' : '')}
                onClick={() => setPerfil(p)}>{p}</button>
            ))}
          </div>
        </div>

        <Btn variant="primary" size="lg" onClick={() => login(perfil)}>Entrar no painel</Btn>
        <div className="lg-note">Protótipo — login fictício, qualquer credencial entra.</div>
      </div>
    </div>
  )
}
