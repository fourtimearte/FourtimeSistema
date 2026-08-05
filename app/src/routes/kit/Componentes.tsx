import { useState } from 'react'
import { Loader2, Plus, Save, Search, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Campo } from '@/components/fourtime/Campo'
import { Dropdown } from '@/components/fourtime/Dropdown'
import { Abas, PainelAba } from '@/components/fourtime/Abas'
import { Badge, Carregando, Chip, Erro, Esqueleto, KpiFiltro, Vazio } from '@/components/fourtime/primitivos'
import { CabecalhoPagina, Nota, Painel } from '@/components/fourtime/pagina'
import { useToast } from '@/components/fourtime/Toast'
import { maskCep, maskCnpj, maskFone } from '@/lib/br'
import { Bloco, Fileira, Porque, SecaoKit } from './pecas'

/* ========================================================== 06 · BOTÕES */

export function Botoes() {
  const [salvando, setSalvando] = useState(false)
  return (
    <SecaoKit
      id="botoes"
      numero="07"
      titulo="Botões"
      lead={
        <>
          O <code>Button</code> do shadcn, como instalado — Base UI por baixo. Os estados são onde mora o trabalho:
          botão bonito todo mundo faz; o que quebra em produção é o desabilitado com contraste ilegível e o "salvar"
          que aceita dois cliques.
        </>
      }
    >
      <Bloco titulo="Variantes">
        <Fileira>
          <Button>
            <Plus /> Novo pedido
          </Button>
          <Button variant="secondary">
            <Save /> Salvar
          </Button>
          <Button variant="outline">Contorno</Button>
          <Button variant="ghost">Cancelar</Button>
          <Button variant="destructive">
            <Trash2 /> Excluir
          </Button>
          <Button variant="link">Link</Button>
        </Fileira>
      </Bloco>

      <Bloco titulo="Tamanhos" nota="xs · sm · default · lg · ícone">
        <Fileira>
          <Button size="xs">xs</Button>
          <Button size="sm">sm</Button>
          <Button>default</Button>
          <Button size="lg">lg</Button>
          <Button size="icon" aria-label="Buscar">
            <Search />
          </Button>
          <Button size="icon-sm" variant="outline" aria-label="Excluir">
            <Trash2 />
          </Button>
        </Fileira>
        <Porque>
          Botão só de ícone leva <code>aria-label</code> sempre. Sem ele, o leitor de tela anuncia "botão" e mais nada.
        </Porque>
      </Bloco>

      <Bloco titulo="Estados">
        <Fileira>
          <Button disabled>Desabilitado</Button>
          <Button variant="outline" disabled>
            Desabilitado
          </Button>
          <Button
            disabled={salvando}
            onClick={() => {
              setSalvando(true)
              setTimeout(() => setSalvando(false), 1400)
            }}
          >
            {salvando ? <Loader2 className="mov-girar" /> : <Save />}
            {salvando ? 'Salvando…' : 'Salvar (clique)'}
          </Button>
        </Fileira>
        <Porque>
          Carregando é <b>desabilitado + rótulo trocado</b>, não só um spinner ao lado. Se o botão continua clicável, o
          usuário nervoso manda o pedido duas vezes — e a fábrica corta duas vezes.
        </Porque>
      </Bloco>
    </SecaoKit>
  )
}

/* ========================================================== 07 · CAMPOS */

export function Campos() {
  const [doc, setDoc] = useState('')
  const [valor, setValor] = useState('89,9,0')
  const [grade, setGrade] = useState('adulta')
  const erroValor = /^\d{1,3}(\.\d{3})*,\d{2}$/.test(valor) ? undefined : 'Use o formato 00,00.'

  return (
    <SecaoKit
      id="campos"
      numero="08"
      titulo="Campos"
      lead={
        <>
          <code>Campo</code> junta rótulo, ajuda e erro numa peça só. O que some quando cada tela monta o seu é sempre
          o mesmo: o <code>htmlFor</code>, o <code>aria-describedby</code> e a mensagem que explica o erro.
        </>
      }
    >
      <Bloco titulo="Normal, com ajuda e em erro">
        <div className="grid gap-3 sm:grid-cols-3">
          <Campo rotulo="Cliente" obrigatorio>
            {(p) => <Input placeholder="Ex.: Escola João XXIII" {...p} />}
          </Campo>
          <Campo rotulo="Nº do pedido" ajuda="Gerado automaticamente.">
            {(p) => <Input defaultValue="PD004168" className="font-mono" readOnly {...p} />}
          </Campo>
          <Campo rotulo="Valor unitário" erro={erroValor}>
            {(p) => <Input value={valor} onChange={(e) => setValor(e.target.value)} className="font-mono" {...p} />}
          </Campo>
        </div>
        <Porque>
          Campo em erro com borda vermelha e sem texto não diz o que corrigir — e para quem usa leitor de tela não diz
          nada. O erro é <code>role="alert"</code> e está ligado ao campo por <code>aria-describedby</code>.
        </Porque>
      </Bloco>

      <Bloco titulo="Máscaras brasileiras" nota="funções puras portadas do sistema antigo, com teste">
        <div className="grid gap-3 sm:grid-cols-3">
          <Campo rotulo="CNPJ">
            {(p) => <Input value={doc} onChange={(e) => setDoc(maskCnpj(e.target.value))} placeholder="00.000.000/0000-00" className="font-mono" {...p} />}
          </Campo>
          <Campo rotulo="CEP">
            {(p) => <Input defaultValue={maskCep('74000000')} className="font-mono" {...p} />}
          </Campo>
          <Campo rotulo="Telefone">
            {(p) => <Input defaultValue={maskFone('62999887766')} className="font-mono" {...p} />}
          </Campo>
        </div>
      </Bloco>

      <Bloco titulo="Seleção e texto longo">
        <Fileira className="items-start">
          <div className="flex flex-col gap-1.5">
            <span className="text-[12px] font-semibold">Grade</span>
            <Dropdown
              rotulo="Grade"
              valor={grade}
              onEscolher={setGrade}
              opcoes={[
                { valor: 'adulta', texto: 'Adulta', contagem: 7 },
                { valor: 'infantil', texto: 'Infantil', contagem: 8 },
              ]}
            />
          </div>
          <Campo rotulo="Observações" className="max-w-[340px] flex-1" ajuda="Vira parágrafo no A4.">
            {(p) => <Textarea rows={3} placeholder="Gola careca, manga curta…" {...p} />}
          </Campo>
        </Fileira>
      </Bloco>

      <Bloco titulo="Desabilitado">
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo rotulo="Bloqueado">{(p) => <Input disabled defaultValue="não editável" {...p} />}</Campo>
          <Campo rotulo="Bloqueado (área)">{(p) => <Textarea disabled rows={2} defaultValue="não editável" {...p} />}</Campo>
        </div>
      </Bloco>
    </SecaoKit>
  )
}

/* ================================================= 08 · ABAS, CHIPS, KPI */

export function Navegacao() {
  const [aba, setAba] = useState('dados')
  const [kpi, setKpi] = useState<string | null>('pf')
  return (
    <SecaoKit
      id="navegacao"
      numero="09"
      titulo="Abas · chips · KPI"
      lead="Abas com a semântica ARIA correta e navegação por seta — não são botões que trocam display. O KPI é filtro, não enfeite: clicar aplica."
    >
      <Bloco titulo="Abas">
        <Abas
          abas={[
            { id: 'dados', rotulo: 'Dados' },
            { id: 'pedidos', rotulo: 'Pedidos', contagem: 12 },
            { id: 'artes', rotulo: 'Artes', contagem: 3 },
            { id: 'financeiro', rotulo: 'Financeiro' },
          ]}
          ativa={aba}
          aoTrocar={setAba}
        />
        <div className="text-muted-foreground pt-3 text-[12px]">
          <PainelAba id="dados" ativa={aba}>Cadastro, documento, contato e endereço.</PainelAba>
          <PainelAba id="pedidos" ativa={aba}>Histórico de pedidos deste cliente.</PainelAba>
          <PainelAba id="artes" ativa={aba}>Layouts e mockups aprovados.</PainelAba>
          <PainelAba id="financeiro" ativa={aba}>Faturas, prazo médio e inadimplência.</PainelAba>
        </div>
        <Porque>
          Seta ←/→ troca de aba, Home e End vão para as pontas, e só a aba ativa fica no fluxo do Tab. É o que a
          especificação ARIA espera — e o que quem usa teclado espera junto.
        </Porque>
      </Bloco>

      <Bloco titulo="Badges e chips">
        <Fileira>
          <Badge>NEUTRO</Badge>
          <Badge tom="pj">PJ</Badge>
          <Badge tom="pf">PF</Badge>
          <Badge tom="ok">APROVADO</Badge>
          <Badge tom="aviso">PENDÊNCIA</Badge>
          <Badge tom="alerta">3 DIAS</Badge>
          <Chip>Goiânia · GO</Chip>
          <Chip>sem contato</Chip>
        </Fileira>
      </Bloco>

      <Bloco titulo="KPI como filtro">
        <div className="grid gap-(--ft-gap) [grid-template-columns:repeat(auto-fit,minmax(176px,1fr))]">
          <KpiFiltro rotulo="Pessoa física" valor={1491} nota="78% da base" proporcao={78} ativo={kpi === 'pf'} onClick={() => setKpi(kpi === 'pf' ? null : 'pf')} icone={null} />
          <KpiFiltro rotulo="Pessoa jurídica" valor={410} nota="22% da base" proporcao={22} ativo={kpi === 'pj'} onClick={() => setKpi(kpi === 'pj' ? null : 'pj')} icone={null} />
          <KpiFiltro rotulo="Atrasados" valor={37} nota="prazo estourado" proporcao={43} ativo={kpi === 'atr'} onClick={() => setKpi(kpi === 'atr' ? null : 'atr')} icone={null} cor="var(--destructive)" />
        </div>
        <Porque>
          KPI que não leva a lugar nenhum é decoração. Aqui ele é <code>aria-pressed</code> e aplica o filtro — o número
          e a lista nunca discordam porque saem da mesma função.
        </Porque>
      </Bloco>
    </SecaoKit>
  )
}

/* ========================================================= 09 · ESTADOS */

export function Estados() {
  const [caso, setCaso] = useState<'feliz' | 'vazio' | 'carregando' | 'erro'>('vazio')
  return (
    <SecaoKit
      id="estados"
      numero="10"
      titulo="Estados: vazio, carregando, erro"
      lead="O caso feliz todo mundo desenha. Estes três aparecem no dia em que o cliente tem zero pedidos ou a rede cai — e se o kit não os mostra, ninguém os desenha."
    >
      <Bloco titulo="Os quatro casos de uma lista">
        <Fileira className="mb-3">
          {(['feliz', 'vazio', 'carregando', 'erro'] as const).map((c) => (
            <Button key={c} size="sm" variant={caso === c ? 'default' : 'outline'} onClick={() => setCaso(c)}>
              {c}
            </Button>
          ))}
        </Fileira>
        <div className="rounded-lg border p-3">
          {caso === 'feliz' && (
            <ul className="flex flex-col gap-1.5 text-[12.5px]">
              {['PD004168 · Climatizadores Bom Ar', 'PD004201 · Fundação Logosófica', 'PD004253 · Saga Brasil'].map((t) => (
                <li key={t} className="bg-secondary rounded px-2.5 py-1.5 font-mono">
                  {t}
                </li>
              ))}
            </ul>
          )}
          {caso === 'vazio' && (
            <Vazio
              titulo="Nenhum pedido ainda"
              descricao="Quando o primeiro orçamento for aprovado, ele aparece aqui."
              acao={<Button size="sm" className="mt-1">Novo orçamento</Button>}
            />
          )}
          {caso === 'carregando' && <Carregando linhas={4} />}
          {caso === 'erro' && (
            <Erro descricao="A sincronização com o servidor falhou. Os dados na tela podem estar desatualizados." aoTentar={() => setCaso('carregando')} />
          )}
        </div>
        <Porque>
          Vazio explica <b>o que fazer</b>, não só que está vazio. Erro diz <b>o que aconteceu</b> e oferece tentar de
          novo. Carregando usa esqueleto com a forma do conteúdo, não um spinner no meio da tela — assim a página não
          "pula" quando o dado chega.
        </Porque>
      </Bloco>

      <Bloco titulo="Esqueleto solto">
        <div className="flex max-w-[320px] flex-col gap-2">
          <Esqueleto className="h-4 w-1/2" />
          <Esqueleto />
          <Esqueleto className="w-4/5" />
        </div>
      </Bloco>
    </SecaoKit>
  )
}

/* ======================================================== 10 · PADRÕES */

export function Padroes() {
  const avisar = useToast()
  return (
    <SecaoKit
      id="padroes"
      numero="11"
      titulo="Padrões de tela"
      lead="Combinações recorrentes resolvidas uma vez. É aqui que a consistência acontece de verdade — nos componentes base ela já vem de graça do shadcn."
    >
      <Bloco titulo="Cabeçalho de página">
        <div className="rounded-lg border p-3">
          <CabecalhoPagina
            titulo="Kanban de produção"
            descricao="As colunas são estações; as faixas são técnicas. Um pedido que mistura técnicas se fatia."
          >
            <Button size="sm" variant="outline">
              Filtros
            </Button>
            <Button size="sm">
              <Plus /> Novo
            </Button>
          </CabecalhoPagina>
        </div>
        <Porque>
          A linha de descrição não é enfeite: é onde cabe a regra da tela. Sem lugar para ela, a regra vira comentário
          no código e ninguém que usa o sistema a lê.
        </Porque>
      </Bloco>

      <Bloco titulo="Painel e nota">
        <Painel titulo="Gargalos por estação" nota="cards parados" acao={<Button size="xs" variant="ghost">ver</Button>}>
          <p className="text-muted-foreground text-[12px]">Conteúdo do painel.</p>
          <Nota>Observação neutra do sistema.</Nota>
          <Nota tom="aviso">Atenção: dado de exemplo até o importador existir.</Nota>
          <Nota tom="perigo">Ação irreversível.</Nota>
        </Painel>
      </Bloco>

      <Bloco titulo="Aviso de ação (toast)">
        <Fileira>
          <Button size="sm" variant="outline" onClick={() => avisar('PD004168 · Patch → CD Costura')}>
            Sucesso
          </Button>
          <Button size="sm" variant="outline" onClick={() => avisar('Sublimação não passa por Revelação de tela.', 'erro')}>
            Recusa
          </Button>
        </Fileira>
        <Porque>
          Um provider só para o sistema inteiro. Quando cada tela escreve o seu, um aviso fica no rodapé, outro no
          canto, e o usuário deixa de procurar.
        </Porque>
      </Bloco>
    </SecaoKit>
  )
}
