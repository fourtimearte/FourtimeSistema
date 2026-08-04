import { useEffect, useState, type CSSProperties } from 'react'
import {
  Palette, SlidersHorizontal, Info, RotateCcw, Check, Sun, Moon, Rows3, Rows4, Sparkles, EyeOff, Wallet,
} from 'lucide-react'
import { useApp } from '../store/useApp'
import { SETORES, SETOR_GRUPOS, PALETA_SETOR, type Setor } from '../store/model'
import { corSetor, normalizaHex } from '../store/prefs'
import { PageHead, Panel, Btn, IconBtn } from '../components/ui'

/* =====================================================================
   CONFIGURAÇÕES — três abas.
   A aba de cores mexe nos tokens --set-*: o sistema inteiro (colunas do
   Kanban, tags de técnica, rail lateral, pílulas da folha A4) lê esses
   tokens em tempo de pintura, então trocar o valor no <html> repinta tudo
   sem nenhum componente saber que a cor mudou.
   Aparência aqui é SÓ classe do kit.css — a única coisa inline é a cor
   escolhida, que é dado e viaja na custom property --sc.
   ===================================================================== */

type TabId = 'cores' | 'aparencia' | 'sistema'

/** cor como dado (não é estilo): vira a custom property que o kit.css lê */
const sc = (hex: string) => ({ ['--sc' as string]: hex }) as CSSProperties

export default function Configuracoes() {
  const [tab, setTab] = useState<TabId>('cores')
  const { prefs, semDinheiro, toggleDinheiro, setPrefs, resetCoresSetor, toast } = useApp()
  const alterados = SETORES.filter(s => prefs.cores[s.token] && prefs.cores[s.token].toUpperCase() !== s.padrao.toUpperCase()).length

  return (
    <div>
      <PageHead crumb="Sistema" title="Configurações"
        desc="Preferências desta estação de trabalho. Ficam salvas no navegador — cada máquina pode ter o seu ajuste sem mexer no que os outros veem."
        actions={alterados > 0 && tab === 'cores'
          ? <Btn size="sm" variant="secondary" onClick={resetCoresSetor}><RotateCcw size={15} />Restaurar cores de fábrica</Btn>
          : undefined} />

      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'cores'} className={'tab' + (tab === 'cores' ? ' on' : '')} onClick={() => setTab('cores')}>
          <Palette />Cores dos departamentos{alterados > 0 && <span className="cnt">{alterados}</span>}
        </button>
        <button role="tab" aria-selected={tab === 'aparencia'} className={'tab' + (tab === 'aparencia' ? ' on' : '')} onClick={() => setTab('aparencia')}>
          <SlidersHorizontal />Aparência
        </button>
        <button role="tab" aria-selected={tab === 'sistema'} className={'tab' + (tab === 'sistema' ? ' on' : '')} onClick={() => setTab('sistema')}>
          <Info />Sistema
        </button>
      </div>

      {tab === 'cores' && <AbaCores />}
      {tab === 'aparencia' && <AbaAparencia prefs={prefs} setPrefs={setPrefs} />}
      {tab === 'sistema' && <AbaSistema semDinheiro={semDinheiro} toggleDinheiro={toggleDinheiro} reset={resetCoresSetor} toast={toast} />}
    </div>
  )
}

/* ------------------------------------------------------------------ cores */

function AbaCores() {
  return (
    <Panel title="Cores dos departamentos" icon={<Palette size={16} />}
      sub="Cada departamento é uma cor só, usada em todo o sistema. Mudou aqui, muda na hora na coluna do Kanban, na tag da técnica, na trilha lateral e na pílula de Design da folha A4.">
      {SETOR_GRUPOS.map(g => {
        const itens = SETORES.filter(s => s.grupo === g)
        if (!itens.length) return null
        return (
          <div key={g}>
            <div className="grpttl">{g}</div>
            <div className="setgrid">{itens.map(s => <CardSetor key={s.token} s={s} />)}</div>
          </div>
        )
      })}
    </Panel>
  )
}

function CardSetor({ s }: { s: Setor }) {
  const { prefs, setCorSetor, resetCorSetor } = useApp()
  const hex = corSetor(prefs, s.token)
  const mudou = hex.toUpperCase() !== s.padrao.toUpperCase()

  /* o campo de texto tem vida própria enquanto se digita "#2 5 6..." e volta
     a seguir a cor efetiva assim que ela muda por outro caminho (paleta, seletor) */
  const [txt, setTxt] = useState(hex)
  useEffect(() => { setTxt(hex) }, [hex])

  const aplicarTexto = (v: string) => {
    const n = normalizaHex(v)
    if (n) setCorSetor(s.token, n); else setTxt(hex)
  }

  return (
    <div className="setcard" style={sc(hex)}>
      <div className="sc-top">
        <input type="color" className="swatch" value={hex} aria-label={'Cor de ' + s.nome}
          onChange={e => setCorSetor(s.token, e.target.value.toUpperCase())} />
        <div>
          <div className="sc-nm">{s.nome}</div>
          <div className="sc-tok">{s.token}</div>
        </div>
        {mudou && (
          <span className="sc-rst">
            <IconBtn title={'Voltar ao padrão ' + s.padrao} onClick={() => resetCorSetor(s.token)}><RotateCcw size={15} /></IconBtn>
          </span>
        )}
      </div>

      <div className="sc-onde">{s.onde}</div>

      <input className="input hexin" value={txt} spellCheck={false} maxLength={7}
        aria-label={'Código hex de ' + s.nome}
        onChange={e => setTxt(e.target.value)}
        onBlur={e => aplicarTexto(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') aplicarTexto((e.target as HTMLInputElement).value) }} />

      <div className="presets">
        {PALETA_SETOR.map(c => (
          <button key={c} type="button" style={sc(c)} title={c}
            className={'preset' + (c.toUpperCase() === hex.toUpperCase() ? ' on' : '')}
            aria-label={'Usar ' + c} onClick={() => setCorSetor(s.token, c)} />
        ))}
      </div>

      <div className="sc-prev">
        <span className="tg">{s.nome}</span>
        <span className="col" />
      </div>
    </div>
  )
}

/* --------------------------------------------------------------- aparência */

type Prefs = ReturnType<typeof useApp.getState>['prefs']

function AbaAparencia({ prefs, setPrefs }: { prefs: Prefs; setPrefs: (p: Partial<Prefs>) => void }) {
  return (
    <Panel title="Aparência" icon={<SlidersHorizontal size={16} />}
      sub="Vale para esta máquina. O tema também troca pelo botão de lua na barra do topo.">
      <div className="cfg-row">
        <div>
          <div className="lb">Tema</div>
          <div className="hint">O escuro usa a mesma paleta, só com os fundos invertidos — as cores dos departamentos continuam iguais.</div>
        </div>
        <div className="ctl">
          <div className="seg">
            <button className={prefs.tema === 'light' ? 'on' : ''} onClick={() => setPrefs({ tema: 'light' })}><Sun />Claro</button>
            <button className={prefs.tema === 'dark' ? 'on' : ''} onClick={() => setPrefs({ tema: 'dark' })}><Moon />Escuro</button>
          </div>
        </div>
      </div>

      <div className="cfg-row">
        <div>
          <div className="lb">Densidade</div>
          <div className="hint">Compacta cabe mais linha na tela (bom para o Kanban e as tabelas); confortável dá mais respiro para quem passa o dia no editor.</div>
        </div>
        <div className="ctl">
          <div className="seg">
            <button className={prefs.densidade === 'compact' ? 'on' : ''} onClick={() => setPrefs({ densidade: 'compact' })}><Rows4 />Compacta</button>
            <button className={prefs.densidade === 'comfort' ? 'on' : ''} onClick={() => setPrefs({ densidade: 'comfort' })}><Rows3 />Confortável</button>
          </div>
        </div>
      </div>

      <div className="cfg-row">
        <div>
          <div className="lb">Realces de cor</div>
          <div className="hint">Desligado, o sistema fica em tons neutros e só o essencial mantém cor — ajuda quando o monitor da produção distorce as cores.</div>
        </div>
        <div className="ctl">
          <div className="seg">
            <button className={prefs.acento === 'on' ? 'on' : ''} onClick={() => setPrefs({ acento: 'on' })}><Sparkles />Ligados</button>
            <button className={prefs.acento === 'off' ? 'on' : ''} onClick={() => setPrefs({ acento: 'off' })}><EyeOff />Discretos</button>
          </div>
        </div>
      </div>
    </Panel>
  )
}

/* ----------------------------------------------------------------- sistema */

function AbaSistema({ semDinheiro, toggleDinheiro, reset, toast }: {
  semDinheiro: boolean; toggleDinheiro: () => void; reset: () => void; toast: (m: string) => void
}) {
  return (
    <>
      <Panel title="Privacidade na tela" icon={<Wallet size={16} />}
        sub="Para mostrar o sistema no chão de fábrica ou em reunião sem expor valor.">
        <div className="cfg-row">
          <div>
            <div className="lb">Ocultar valores</div>
            <div className="hint">Troca todo preço, total e KPI de dinheiro por ●●●●. Continua tudo somando por baixo — é só a exibição.</div>
          </div>
          <div className="ctl">
            <div className="seg">
              <button className={!semDinheiro ? 'on' : ''} onClick={() => { if (semDinheiro) toggleDinheiro() }}><Check />Mostrar</button>
              <button className={semDinheiro ? 'on' : ''} onClick={() => { if (!semDinheiro) toggleDinheiro() }}><EyeOff />Ocultar</button>
            </div>
          </div>
        </div>
      </Panel>

      <Panel title="Sobre" icon={<Info size={16} />} sub="Fourtime · CRM + ERP + Editor de Orçamentos">
        <div className="cfg-row">
          <div>
            <div className="lb">Restaurar padrões de cor</div>
            <div className="hint">Devolve os doze departamentos às cores de fábrica do Design Kit v5. Não apaga pedido, cliente nem layout.</div>
          </div>
          <div className="ctl"><Btn size="sm" variant="danger" onClick={reset}><RotateCcw size={15} />Restaurar</Btn></div>
        </div>
        <div className="cfg-row">
          <div>
            <div className="lb">Onde as preferências ficam</div>
            <div className="hint">No próprio navegador desta máquina (não sobem para o servidor). Limpar os dados do site devolve tudo ao padrão.</div>
          </div>
          <div className="ctl"><Btn size="sm" variant="ghost" onClick={() => toast('Protótipo — sincronizar preferências por usuário entra com o backend')}>Sincronizar por usuário</Btn></div>
        </div>
      </Panel>
    </>
  )
}
