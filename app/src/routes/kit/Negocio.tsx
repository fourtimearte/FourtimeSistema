import { useMemo, useState } from 'react'
import { CORES_TECIDO, TECIDOS } from '@/lib/biblioteca'
import { ESTACOES, FAIXAS, ORDEM_TECNICAS, TECNICAS, corEstacao } from '@/lib/pedidos/tipos'
import { PEDIDOS_SEED } from '@/data/pedidosSeed'
import { rotear } from '@/lib/pedidos/roteador'
import { gargalos, giroPorTecnica } from '@/lib/pedidos/regras'
import { PaletaCores, CardTecido } from '@/components/fourtime/biblioteca'
import { GradeTamanhos } from '@/components/fourtime/GradeTamanhos'
import { CardFatia } from '@/components/fourtime/CardFatia'
import { PontoTecnica, TagTecnica } from '@/components/fourtime/TagTecnica'
import { Bloco, Fileira, Porque, SecaoKit } from './pecas'

const HOJE = new Date()

/* ============================================= 11 · TÉCNICAS E ESTAÇÕES */

export function Tecnicas() {
  return (
    <SecaoKit
      id="tecnicas"
      numero="12"
      titulo="Técnicas e estações"
      lead={
        <>
          Uma técnica = uma cor, do editor ao card na esteira. A tag mora em <code>TagTecnica</code> e a cor em{' '}
          <code>TECNICAS</code> — se cada tela escrevesse o seu chip, uma delas ficaria para trás numa troca de paleta e
          o operador passaria a ver duas cores para a mesma coisa.
        </>
      }
    >
      <Bloco titulo="Tags de técnica" nota="preenchidas: chamam atenção e saem da paleta categórica">
        <Fileira>
          {ORDEM_TECNICAS.map((t) => (
            <TagTecnica key={t} tecnica={t} />
          ))}
        </Fileira>
        <Fileira className="mt-2.5">
          {ORDEM_TECNICAS.map((t) => (
            <span key={t} className="flex items-center gap-1.5 text-[11.5px]">
              <PontoTecnica tecnica={t} />
              {TECNICAS[t].rotulo}
            </span>
          ))}
        </Fileira>
        <Porque>
          A bolinha existe para onde não cabe o rótulo (card denso, fila do topo) e nunca aparece sem{' '}
          <code>aria-label</code>: cor sem nome não é informação.
        </Porque>
      </Bloco>

      <Bloco titulo="Faixas e estações" nota="a cor da coluna do Kanban sai daqui">
        <div className="flex flex-col gap-2.5">
          {FAIXAS.map((f) => (
            <div key={f.key} className="flex flex-wrap items-center gap-1.5">
              <span className="flex w-[188px] shrink-0 items-center gap-2 text-[11.5px] font-semibold">
                <span className="size-2.5 rounded-full" style={{ background: f.cor }} />
                {f.nome}
              </span>
              {ESTACOES.filter((e) => e.faixa === f.key).map((e) => (
                <span
                  key={e.id}
                  className="rounded-full border px-2 py-0.5 text-[10.5px]"
                  style={{ borderColor: corEstacao(e.id), color: corEstacao(e.id) }}
                >
                  {e.nome}
                </span>
              ))}
            </div>
          ))}
        </div>
      </Bloco>
    </SecaoKit>
  )
}

/* ===================================================== 12 · CARD DE FATIA */

export function Fatia() {
  const cards = useMemo(() => rotear(PEDIDOS_SEED), [])
  const normal = cards.find((c) => c.estacao !== 'separacao') ?? cards[0]
  const atrasada = cards.find((c) => c.entrega < '05/08/2026') ?? cards[1]
  return (
    <SecaoKit
      id="fatia"
      numero="13"
      titulo="Card de fatia"
      lead={
        <>
          A unidade que atravessa a produção. É o componente <b>real</b> do Kanban, importado — não uma versão
          simplificada desenhada para o kit. Um kit que redesenha o componente começa a mentir no mesmo instante.
        </>
      }
    >
      <Bloco titulo="Normal, atrasada, aguardando irmã, em destaque">
        <div className="grid gap-2.5 sm:grid-cols-4" data-density="compacta">
          <CardFatia c={normal} hoje={HOJE} />
          <CardFatia c={atrasada} hoje={HOJE} />
          <CardFatia c={{ ...normal, id: normal.id + '-b' }} hoje={HOJE} espera />
          <CardFatia c={{ ...normal, id: normal.id + '-c' }} hoje={HOJE} realce />
        </div>
        <Porque>
          O card atrasado ganha <b>borda</b> vermelha e tarja vazada, nunca fundo vermelho. Numa coluna com dez
          atrasados, o preenchido vira um bloco só e a informação se perde.
        </Porque>
      </Bloco>
    </SecaoKit>
  )
}

/* ===================================================== 13 · GRADE E PREÇO */

export function Grade() {
  return (
    <SecaoKit
      id="grade"
      numero="14"
      titulo="Grade de tamanhos"
      lead="O coração comercial do orçamento. O cálculo vive em funções puras (lib/grade.ts) e a tabela só desenha — é o que permite testar o total sem abrir navegador."
    >
      <Bloco titulo="Grade adulta com um infantil no meio">
        <GradeTamanhos
          grade="adulta"
          linhas={[
            { tamanho: 'PP', qtd: 4, uni: 89.9 },
            { tamanho: 'M', qtd: 10, uni: 89.9 },
            { tamanho: 'G', qtd: 8, uni: 89.9 },
            { tamanho: 'GG', qtd: 2, uni: 94.9 },
            { tamanho: '10A', qtd: 6, uni: 79.9 },
          ]}
        />
        <Porque>
          O sinal do editor antigo que não pode se perder: tamanho infantil digitado numa grade adulta quase sempre é
          engano — e sai caro, porque a peça é cortada em outro molde. Ganha <b>fundo tingido</b> e não contorno
          vermelho, porque é <b>classificação</b>, não alerta: contorno vermelho aqui já quer dizer atraso.
        </Porque>
        <Porque>
          O rodapé mostra a média <b>ponderada</b>: 88,23 nas 30 peças. A média simples dos cinco unitários daria
          88,90 — perto o bastante para ninguém desconfiar, e errado o bastante para bagunçar a margem.
        </Porque>
      </Bloco>
    </SecaoKit>
  )
}

/* =================================================== 14 · BIBLIOTECA VISUAL */

export function Biblioteca() {
  const [sel, setSel] = useState<string[]>(['Vermelho Fourtime'])
  const alternar = (n: string) => setSel((s) => (s.includes(n) ? s.filter((x) => x !== n) : [...s, n]))
  return (
    <SecaoKit
      id="biblioteca"
      numero="15"
      titulo="Biblioteca visual — cores e tecidos"
      lead={
        <>
          As duas peças mais usadas no dia a dia: a paleta de cores de peça e o card de tecido. Os hex daqui são a única
          exceção à regra de "nenhuma cor literal": eles descrevem a cor <b>física</b> do rolo no estoque, como uma foto
          — não viram claros porque o tema mudou.
        </>
      }
    >
      <Bloco titulo="Paleta de cores" nota={sel.length ? sel.join(' · ') : 'nenhuma selecionada'}>
        <PaletaCores cores={CORES_TECIDO} selecionadas={sel} aoAlternar={alternar} />
        <Porque>
          O tique da amostra selecionada é branco com sombra projetada porque a amostra pode ser branca — um tique que
          herdasse a cor do texto sumiria justamente na cor mais usada da fábrica.
        </Porque>
      </Bloco>

      <Bloco titulo="Cards de tecido" nota="a amostra é CSS, não imagem — pesa zero e não precisa de upload">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(168px,1fr))] gap-2.5">
          {TECIDOS.map((t) => (
            <CardTecido key={t.ref} t={t} />
          ))}
        </div>
      </Bloco>
    </SecaoKit>
  )
}

/* ============================================================ 15 · DADOS */

export function Dados() {
  const gar = useMemo(() => gargalos(PEDIDOS_SEED), [])
  const giro = useMemo(() => giroPorTecnica(PEDIDOS_SEED), [])
  const max = gar[0]?.n ?? 1
  return (
    <SecaoKit
      id="dados"
      numero="16"
      titulo="Dados: qual paleta em qual gráfico"
      lead="A decisão que erra mais: usar a rampa sequencial para categorias. As duas ao lado uma da outra, com o mesmo dado real do Dashboard."
    >
      <div className="grid gap-3 lg:grid-cols-2">
        <Bloco titulo="Sequencial" nota="uma grandeza variando intensidade">
          <ul className="flex flex-col gap-2.5">
            {gar.map((g, i) => (
              <li key={g.estacao} className="grid grid-cols-[124px_1fr_32px] items-center gap-2.5 text-xs">
                <span className="truncate">{g.nome}</span>
                <span className="bg-secondary h-2 overflow-hidden rounded-full">
                  <span
                    className="block h-full rounded-full"
                    style={{ width: `${(g.n / max) * 100}%`, background: `var(--chart-${Math.min(5, i + 1)})` }}
                  />
                </span>
                <span className="text-right font-mono tabular-nums">{g.n}</span>
              </li>
            ))}
          </ul>
          <Porque>
            Cards parados por estação: uma grandeza só. A ordem se lê na claridade, e o gráfico continua legível em
            preto e branco.
          </Porque>
        </Bloco>

        <Bloco titulo="Categórica" nota="categorias que não têm ordem">
          <ul className="flex flex-col gap-2.5">
            {giro.map((g) => (
              <li key={g.tecnica} className="grid grid-cols-[124px_1fr_40px] items-center gap-2.5 text-xs">
                <span className="flex items-center gap-1.5 truncate">
                  <span className="size-2 shrink-0 rounded-full" style={{ background: g.cor }} />
                  {g.rotulo}
                </span>
                <span className="bg-secondary h-2 overflow-hidden rounded-full">
                  <span className="block h-full rounded-full" style={{ width: `${g.pct}%`, background: g.cor }} />
                </span>
                <span className="text-right font-mono tabular-nums">{g.pct.toFixed(0)}%</span>
              </li>
            ))}
          </ul>
          <Porque>
            Giro por técnica: seis categorias sem ordem entre si. Na rampa vermelha, DTF e Silk se distinguiriam só por
            claridade — e some em P&amp;B.
          </Porque>
        </Bloco>
      </div>
    </SecaoKit>
  )
}
