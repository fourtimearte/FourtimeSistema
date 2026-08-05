import { useState } from 'react'
import { ICONES } from '@/lib/icones'
import { GRUPOS_MOV, MOVIMENTOS, type Movimento } from '@/lib/movimento'
import { Badge } from '@/components/fourtime/primitivos'
import { Button } from '@/components/ui/button'
import { Amostra, Bloco, Fileira, Porque, SecaoKit, Token } from './pecas'

/* ============================================================ 01 · CORES */

export function Cores() {
  return (
    <SecaoKit
      id="cores"
      numero="01"
      titulo="Cor"
      lead={
        <>
          Base neutra, vermelho da marca como único acento. Todo valor nasce em <code>index.css</code> (o preset) ou em{' '}
          <code>tokens-v6.css</code> (o que o preset não traz). Cor literal em componente é proibida: um{' '}
          <code>#1a1a1a</code> cravado não sabe que o tema mudou, e o defeito só aparece semanas depois, numa tela que
          ninguém estava olhando.
        </>
      }
    >
      <Bloco titulo="A regra do vermelho" nota="ação e alerta são o mesmo vermelho, separados pelo tratamento">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border p-3">
            <div className="mb-2 text-[12px] font-semibold">Ação — preenchido</div>
            <Fileira>
              <Button size="sm">Novo pedido</Button>
              <span className="bg-primary text-primary-foreground rounded-full px-2.5 py-1 text-[11px] font-semibold">
                ativo
              </span>
            </Fileira>
            <p className="text-muted-foreground mt-2 text-[11px]">Botão primário, aba ativa, seleção.</p>
          </div>
          <div className="rounded-lg border p-3">
            <div className="mb-2 text-[12px] font-semibold">Alerta — contorno</div>
            <Fileira>
              <Badge tom="alerta">3 DIAS</Badge>
              <Badge tom="aviso">AGUARDA IRMÃO</Badge>
              <Badge tom="ok">APROVADO</Badge>
            </Fileira>
            <p className="text-muted-foreground mt-2 text-[11px]">Atraso, pendência, conferência.</p>
          </div>
        </div>
        <Porque>
          Alerta é <b>sempre contorno, nunca preenchido</b>. No Kanban há 37 fatias atrasadas ao mesmo tempo: se o
          vermelho fosse fundo, ele tomaria a tela e o operador pararia de enxergar o resto — inclusive os atrasos.
        </Porque>
      </Bloco>

      <Bloco titulo="Rampa sequencial" nota="--chart-1..5 · uma grandeza que cresce">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <Amostra key={i} cor={`var(--chart-${i})`} rotulo={`chart-${i}`} nota="varia luminosidade" />
          ))}
        </div>
        <Porque>
          Serve para intensidade — gargalo por estação, faturamento por mês. É toda vermelha de propósito: a ordem se lê
          na claridade.
        </Porque>
      </Bloco>

      <Bloco titulo="Paleta categórica" nota="--cat-1..8 · categorias distintas">
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Amostra key={i} cor={`var(--cat-${i})`} rotulo={`cat-${i}`} nota="varia matiz" />
          ))}
        </div>
        <Porque>
          É a correção mais importante do V6. Cinco técnicas na rampa vermelha se distinguiriam <b>só por claridade</b>{' '}
          — o que some em impressão P&amp;B e falha em baixa visão. Estas oito variam <b>matiz</b>, com L e C quase
          constantes. Técnica, setor e tipo de cliente saem daqui.
        </Porque>
      </Bloco>

      <Bloco titulo="Estado e superfície">
        <div className="grid gap-x-6 md:grid-cols-2">
          <Token nome="--success" valor="var(--success)" uso="entregue, aprovado" />
          <Token nome="--warning" valor="var(--warning)" uso="pendência, aguardando" />
          <Token nome="--info" valor="var(--info)" uso="observação do sistema" />
          <Token nome="--destructive" valor="var(--destructive)" uso="atraso, exclusão" />
          <Token nome="--background" valor="var(--background)" uso="fundo da aplicação" />
          <Token nome="--card" valor="var(--card)" uso="superfície de painel" />
          <Token nome="--secondary" valor="var(--secondary)" uso="fundo de coluna, chip neutro" />
          <Token nome="--border" valor="var(--border)" uso="divisórias" />
          <Token nome="--muted-foreground" valor="var(--muted-foreground)" uso="texto de apoio" />
          <Token nome="--whatsapp" valor="var(--whatsapp)" uso="marca externa — não é decisão nossa" />
        </div>
        <Porque>
          O tema neutro do shadcn só traz <code>destructive</code>. Sem <code>success</code>, <code>warning</code> e{' '}
          <code>info</code> declarados, cada tela inventa o seu verde — e o sistema fica com três.
        </Porque>
      </Bloco>

      <Bloco titulo="Uma correção no preset">
        <Token nome="--sidebar-primary (.dark)" valor="var(--sidebar-primary)" uso="era oklch(0.488 0.243 264.376) — roxo" />
        <Porque>
          O gerador deixou um azul-roxo herdado do default do shadcn. Num sistema preto e vermelho, isso acendia o item
          de menu ativo em roxo. Trocado pelo neutro claro, coerente com o <code>:root</code>.
        </Porque>
      </Bloco>
    </SecaoKit>
  )
}

/* ======================================================= 02 · TIPOGRAFIA */

export function Tipografia() {
  const linhas: [string, string, React.CSSProperties][] = [
    ['display · 30 · 600', 'Orçamento Fourtime Arte', { fontSize: 30, fontWeight: 600, letterSpacing: '-0.02em' }],
    ['título · 20 · 600', 'Pedidos em produção', { fontSize: 20, fontWeight: 600 }],
    ['seção · 15 · 600', 'Tabela de tamanhos', { fontSize: 15, fontWeight: 600 }],
    ['corpo · 13 · 500', 'Camiseta dry-fit · gola careca · DTF + Silk', { fontSize: 13, fontWeight: 500 }],
    ['apoio · 12 · 400', 'Observações e campos secundários', { fontSize: 12, color: 'var(--muted-foreground)' }],
    ['micro · 11 · 600', 'RÓTULO DE SEÇÃO', { fontSize: 11, fontWeight: 600, letterSpacing: '0.06em' }],
  ]
  return (
    <SecaoKit
      id="tipografia"
      numero="02"
      titulo="Tipografia"
      lead={
        <>
          <b>IBM Plex Sans</b> nos títulos (<code>font-heading</code>), <b>Montserrat</b> no texto, e a mono do sistema
          para número. É a escolha do preset <code>b7AJGDOVg8</code>.
        </>
      }
    >
      <Bloco titulo="Títulos — IBM Plex Sans">
        {linhas.map(([rotulo, texto, estilo]) => (
          <div key={rotulo} className="flex items-baseline gap-4 border-b border-dashed py-1.5 last:border-b-0">
            <span className="text-muted-foreground w-[128px] shrink-0 font-mono text-[10.5px]">{rotulo}</span>
            <span className="font-heading truncate" style={estilo}>
              {texto}
            </span>
          </div>
        ))}
      </Bloco>

      <Bloco titulo="Texto — Montserrat">
        <p className="max-w-[70ch] text-[13px]">
          O corpo do sistema é Montserrat. Ela é mais larga que a Plex, então parágrafo longo em coluna estreita cansa —
          por isso as descrições de tela têm largura máxima em <code>ch</code>, não em pixel.
        </p>
      </Bloco>

      <Bloco titulo="Número — mono + tabular-nums">
        <div className="flex flex-col gap-1 font-mono text-[13px] tabular-nums">
          <span>PD004168 · REF-4021 · R$ 2.140,00 · 24 pçs</span>
          <span>PP 4 · M 10 · G 8 · GG 2 · Total 24 · 89,90</span>
        </div>
        <Porque>
          Todo número de tabela usa <code>tabular-nums</code> e alinha à direita. Sem isso as casas decimais dançam
          linha a linha e conferir a coluna vira trabalho manual.
        </Porque>
      </Bloco>
    </SecaoKit>
  )
}

/* ============================================ 03 · FORMA, ESPAÇO, DENSIDADE */

export function Forma() {
  return (
    <SecaoKit
      id="forma"
      numero="04"
      titulo="Forma · espaço · densidade"
      lead={
        <>
          Raio <code>0.45rem</code> — Small no preset. Luma é um estilo espaçoso, e o CRM tem Kanban, grade de pedidos e
          estoque: telas que precisam mostrar muita linha. A saída não é misturar dois estilos, é uma camada de
          densidade.
        </>
      }
    >
      <Bloco titulo="Raio">
        <Fileira>
          {['sm', 'md', 'lg', 'xl', '2xl'].map((r) => (
            <div
              key={r}
              className="bg-secondary text-muted-foreground grid size-[74px] place-items-end justify-center border pb-1.5 font-mono text-[10px]"
              style={{ borderRadius: `var(--radius-${r})` }}
            >
              {r}
            </div>
          ))}
        </Fileira>
      </Bloco>

      <Bloco titulo="Densidade" nota="as duas lado a lado, para comparar">
        <div className="grid gap-3 sm:grid-cols-2">
          {(['confortavel', 'compacta'] as const).map((d) => (
            <div key={d} data-density={d} className="rounded-lg border p-(--ft-card-pad)">
              <div className="mb-2 font-mono text-[11px] font-semibold">{d}</div>
              <div className="flex flex-col gap-2">
                <button className="bg-primary text-primary-foreground h-(--ft-control-h) rounded-lg px-3 text-[12px] font-semibold">
                  Botão
                </button>
                <div className="bg-secondary flex h-(--ft-row-h) items-center rounded px-(--ft-pad-x) font-mono text-[11px]">
                  linha de tabela
                </div>
                <div className="bg-secondary flex h-(--ft-row-h) items-center rounded px-(--ft-pad-x) font-mono text-[11px]">
                  linha de tabela
                </div>
              </div>
            </div>
          ))}
        </div>
        <Porque>
          A densidade muda <b>só</b> <code>--ft-control-h</code>, <code>--ft-row-h</code>, <code>--ft-pad-*</code> e{' '}
          <code>--ft-gap</code>. Raio, cor, sombra e escala tipográfica ficam intactos — é isso que faz a tabela
          apertada continuar parecendo o mesmo sistema do cadastro. E ela se aplica a um <b>contêiner</b>, nunca a um
          componente solto: meia tabela compacta dentro de um card confortável lê como defeito.
        </Porque>
        <Porque>
          Em <code>@media (pointer: coarse)</code> a compacta <b>volta sozinha</b> para confortável. Uma linha de 28px é
          ótima com mouse e impossível com o dedo — o alvo mínimo de toque é 44×44px, e no galpão o sistema é usado no
          celular.
        </Porque>
      </Bloco>

      <Bloco titulo="Movimento — tokens">
        <Token nome="--ft-dur-fast" uso="120ms · hover, foco" />
        <Token nome="--ft-dur" uso="200ms · troca de estado" />
        <Token nome="--ft-dur-slow" uso="300ms · gaveta, modal" />
        <Token nome="--ft-ease" uso="cubic-bezier(0.16, 1, 0.3, 1)" />
      </Bloco>
    </SecaoKit>
  )
}

/* =========================================================== 04 · ÍCONES */

export function Icones() {
  return (
    <SecaoKit
      id="icones"
      numero="05"
      titulo="Ícones"
      lead={
        <>
          Lucide tem mais de mil ícones. Um por conceito, nomeado pelo <b>conceito</b> e não pelo desenho — senão o
          sistema acaba com três "editar" diferentes e quem chegou ontem aprende três vezes.
        </>
      }
    >
      <Bloco>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(104px,1fr))] gap-2">
          {ICONES.map(({ conceito, icone: Ic, nome }) => (
            <div key={conceito} className="flex flex-col items-center gap-1.5 rounded-lg border px-2 py-2.5 text-center">
              <Ic className="size-[19px]" />
              <span className="text-[10.5px] leading-tight font-medium">{conceito}</span>
              <span className="text-muted-foreground font-mono text-[9px]">{nome}</span>
            </div>
          ))}
        </div>
        <Porque>
          Ícone sozinho, sem rótulo visível, precisa de <code>aria-label</code>. Um botão que é só uma lixeirinha não
          diz nada para leitor de tela — e, na prática, também não diz nada para quem chegou ontem. Emoji não é ícone:
          renderiza diferente em cada sistema, não herda a cor do texto e não escala com a tipografia.
        </Porque>
      </Bloco>
    </SecaoKit>
  )
}

/* ======================================================== 05 · MOVIMENTO */

export function Movimento() {
  return (
    <SecaoKit
      id="movimento"
      numero="06"
      titulo="Movimento"
      lead={
        <>
          Cada animação tem um <b>nome</b>. Dizer "aplica <code>quicar</code> no botão de salvar" tem de dar sempre a
          mesma coisa — o nome é o contrato. Os nomes vieram do kit v5; os valores foram refeitos sobre os tokens do V6.
        </>
      }
    >
      {GRUPOS_MOV.map((g) => (
        <Bloco key={g.key} titulo={g.titulo} nota={g.nota}>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(196px,1fr))] gap-2.5">
            {MOVIMENTOS.filter((m) => m.grupo === g.key).map((m) => (
              <CartaoMovimento key={m.nome} m={m} />
            ))}
          </div>
        </Bloco>
      ))}
      <Porque>
        Todas respeitam <code>prefers-reduced-motion</code> — a regra global em <code>@layer base</code> zera duração de
        animação e de transição, então nenhuma animação nova precisa lembrar disso.
      </Porque>
    </SecaoKit>
  )
}

function CartaoMovimento({ m }: { m: Movimento }) {
  const [n, setN] = useState(0)
  const [contador, setContador] = useState(142)

  function tocar() {
    setN((x) => x + 1)
    if (m.palco === 'contar') {
      const t0 = performance.now()
      setContador(0)
      const passo = () => {
        const p = Math.min(1, (performance.now() - t0) / 900)
        setContador(Math.round((1 - (1 - p) ** 2) * 142))
        if (p < 1) requestAnimationFrame(passo)
      }
      requestAnimationFrame(passo)
    }
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="bg-secondary grid h-[92px] place-items-center overflow-hidden border-b">
        <Palco m={m} chave={n} contador={contador} />
      </div>
      <div className="flex flex-col gap-1 p-2.5">
        <code className="bg-primary/12 text-primary self-start rounded-full px-2 py-0.5 text-[11.5px] font-bold">
          {m.nome}
        </code>
        <span className="text-[11.5px] font-medium">{m.descricao}</span>
        <span className="text-muted-foreground text-[10.5px] leading-snug">
          {m.uso} · <span className="font-mono">{m.tempo}</span>
        </span>
        <button
          onClick={tocar}
          className="hover:bg-accent mt-1 h-(--ft-control-h-sm) rounded-lg border text-[11px] font-semibold"
        >
          ▶ testar
        </button>
      </div>
    </div>
  )
}

function Palco({ m, chave, contador }: { m: Movimento; chave: number; contador: number }) {
  const alvo = 'bg-primary text-primary-foreground grid size-[52px] place-items-center rounded-lg font-mono font-bold'
  switch (m.palco) {
    case 'cascata':
      return (
        <div key={chave} className="mov-cascata flex gap-1.5">
          {Array.from({ length: 5 }, (_, i) => (
            <span key={i} className="bg-primary block h-10 w-3 rounded-sm" />
          ))}
        </div>
      )
    case 'girar':
      return <span className="mov-girar border-secondary border-t-primary block size-8 rounded-full border-[3px]" />
    case 'esqueleto':
      return (
        <div className="flex w-3/4 flex-col gap-1.5">
          <span className="esqueleto block h-2.5 w-full" />
          <span className="esqueleto block h-2.5 w-4/5" />
          <span className="esqueleto block h-2.5 w-3/5" />
        </div>
      )
    case 'contar':
      return <span className="font-mono text-2xl font-bold tabular-nums">{contador}</span>
    case 'chip':
      return (
        <span
          key={chave}
          className={`${m.classe} bg-primary text-primary-foreground rounded-full px-3.5 py-1.5 text-[12px] font-bold`}
        >
          Fourtime
        </span>
      )
    case 'linha':
      return <span key={chave} className={`${m.classe} bg-card block h-8 w-[124px] rounded-md border`} />
    default:
      return (
        <span key={chave} className={`${m.classe} ${alvo}`}>
          A
        </span>
      )
  }
}
