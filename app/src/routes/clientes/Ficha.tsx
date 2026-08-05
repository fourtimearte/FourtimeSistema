import { useEffect, useState } from 'react'
import { Building2, FileText, Mail, MapPin, MessageCircle, Phone, UserRound, X } from 'lucide-react'
import { Abas } from '@/components/fourtime/Abas'
import { Badge, Vazio } from '@/components/fourtime/primitivos'
import { cidadeUf, ehPJ, incompleto, temDoc, tituloPt } from '@/lib/clientes/regras'
import { linkWhats } from '@/lib/br'
import type { Cliente } from '@/lib/clientes/tipos'
import { cn } from '@/lib/utils'

type Aba = 'dados' | 'pedidos' | 'artes' | 'financeiro'

export function Ficha({ cliente, duplicado, onFechar }: { cliente: Cliente; duplicado: boolean; onFechar: () => void }) {
  const [aba, setAba] = useState<Aba>('dados')
  const pj = ehPJ(cliente)
  const nome = pj ? cliente.nome : tituloPt(cliente.nome)
  const { cidade, uf } = cidadeUf(cliente)
  const wa = linkWhats(cliente.contato)

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onFechar()
    document.addEventListener('keydown', esc)
    return () => document.removeEventListener('keydown', esc)
  }, [onFechar])

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/45" onClick={onFechar} />
      <aside
        role="dialog"
        aria-modal
        aria-label={`Ficha de ${nome}`}
        className="bg-card fixed top-0 right-0 z-50 flex h-svh w-full max-w-[520px] flex-col border-l shadow-2xl"
      >
        <header className="flex items-start gap-3 border-b p-(--ft-card-pad)">
          <span className={cn('grid size-11 shrink-0 place-items-center rounded-[10px]', pj ? 'bg-cat-6/15 text-cat-6' : 'bg-cat-5/15 text-cat-5')}>
            {pj ? <Building2 className="size-5" /> : <UserRound className="size-5" />}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-heading truncate text-[17px] font-semibold">{nome}</h2>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <Badge tom={pj ? 'pj' : 'pf'}>{pj ? 'PESSOA JURÍDICA' : 'PESSOA FÍSICA'}</Badge>
              {cliente.ativo !== false && <Badge tom="ok">ATIVO</Badge>}
              {duplicado && <Badge tom="aviso">POSSÍVEL DUPLICADO</Badge>}
              {incompleto(cliente) && <Badge tom="alerta">CADASTRO INCOMPLETO</Badge>}
            </div>
          </div>
          <button onClick={onFechar} aria-label="Fechar" className="hover:bg-accent grid size-8 shrink-0 place-items-center rounded-lg">
            <X className="size-4" />
          </button>
        </header>

        {/* Acesso rápido: o que mais se consulta nunca fica atrás de aba */}
        <div className="bg-secondary text-muted-foreground flex flex-wrap gap-x-4 gap-y-1.5 border-b px-(--ft-pad-x) py-(--ft-pad-y) text-xs">
          {cliente.contato ? (
            <span className="flex items-center gap-1.5">
              <Phone className="size-3.5" />
              <span className="text-foreground font-mono">{cliente.contato}</span>
              {wa && (
                <a href={wa} target="_blank" rel="noopener" aria-label="Abrir WhatsApp" className="bg-whatsapp/20 text-whatsapp grid size-5 place-items-center rounded">
                  <MessageCircle className="size-3" />
                </a>
              )}
            </span>
          ) : (
            <span className="flex items-center gap-1.5"><Phone className="size-3.5" /> sem telefone</span>
          )}
          <span className="flex items-center gap-1.5">
            <MapPin className="size-3.5" />
            {cidade ? `${cidade}${uf ? ` · ${uf}` : ''}` : 'sem cidade'}
          </span>
          <span className="flex items-center gap-1.5"><FileText className="size-3.5" /> nenhum pedido</span>
        </div>

        <Abas
          className="px-(--ft-pad-x)"
          abas={[
            { id: 'dados', rotulo: 'Dados' },
            { id: 'pedidos', rotulo: 'Pedidos' },
            { id: 'artes', rotulo: 'Artes' },
            { id: 'financeiro', rotulo: 'Financeiro' },
          ]}
          ativa={aba}
          aoTrocar={(id: string) => setAba(id as Aba)}
        />

        <div className="flex-1 overflow-y-auto">
          {aba === 'dados' && <AbaDados c={cliente} />}
          {aba === 'pedidos' && (
            <div className="p-(--ft-card-pad)">
              <Vazio
                titulo="Nenhum pedido ainda"
                descricao="O histórico se forma quando os .ft do Drive forem importados — o pedido aponta para o id deste cliente."
              />
            </div>
          )}
          {aba === 'artes' && (
            <div className="p-(--ft-card-pad)">
              <Vazio
                titulo="Biblioteca de artes vazia"
                descricao="Hoje as artes deste cliente estão em cards do Trello e nas imagens dentro dos .ft. Aqui elas se juntam num lugar só."
              />
            </div>
          )}
          {aba === 'financeiro' && (
            <div className="p-(--ft-card-pad)">
              <Vazio
                titulo="Sem posição financeira"
                descricao="Total comprado, ticket médio e saldos em aberto aparecem aqui quando o módulo Financeiro entrar."
              />
            </div>
          )}
        </div>

        <footer className="flex flex-wrap gap-2 border-t p-(--ft-pad-x)">
          {wa && (
            <a href={wa} target="_blank" rel="noopener" className="hover:bg-accent flex h-(--ft-control-h-sm) items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium">
              <MessageCircle className="size-3.5" /> WhatsApp
            </a>
          )}
          {cliente.email && (
            <a href={`mailto:${cliente.email}`} className="hover:bg-accent flex h-(--ft-control-h-sm) items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium">
              <Mail className="size-3.5" /> E-mail
            </a>
          )}
          <span className="flex-1" />
          <button className="hover:bg-accent h-(--ft-control-h-sm) rounded-lg border px-2.5 text-xs font-medium">Editar</button>
        </footer>
      </aside>
    </>
  )
}

function AbaDados({ c }: { c: Cliente }) {
  const pj = ehPJ(c)
  const { cidade, uf } = cidadeUf(c)
  const endereco = [c.endereco, c.complemento, c.bairro, cidade && `${cidade}${uf ? ` - ${uf}` : ''}`, c.cep && `CEP ${c.cep}`]
    .filter(Boolean)
    .join(' · ')
  return (
    <>
      <Secao titulo="Identificação" />
      {c.blingId && <Linha rotulo="ID Bling" valor={<span className="font-mono">{c.blingId}</span>} />}
      <Linha rotulo={pj ? 'CNPJ' : 'CPF'} valor={temDoc(c) ? <span className="font-mono">{c.doc}</span> : <Ausente />} />
      {c.ie && <Linha rotulo={pj ? 'Inscrição estadual' : 'RG'} valor={<span className="font-mono">{c.ie}</span>} />}
      {c.fantasia && <Linha rotulo="Nome fantasia" valor={c.fantasia} />}
      <Linha rotulo="Segmento" valor={c.segmento || <Ausente />} />
      <Linha rotulo="Vendedor" valor={c.vendedor && c.vendedor !== '—' ? c.vendedor : <Ausente />} />
      <Linha
        rotulo="Cliente desde"
        valor={<span className="font-mono">{c.criadoEm ? new Date(c.criadoEm).toLocaleDateString('pt-BR') : '—'}</span>}
      />

      <Secao titulo="Contato" />
      <Linha rotulo="Telefone" valor={c.contato ? <span className="font-mono">{c.contato}</span> : <Ausente />} />
      <Linha rotulo="E-mail" valor={c.email?.toLowerCase() ?? <Ausente />} />

      <Secao titulo="Endereço" />
      <Linha rotulo="Endereço" valor={endereco || <Ausente />} />

      <div className="p-(--ft-card-pad)">
        <p className="text-muted-foreground border-info bg-secondary rounded-r-lg border-l-[3px] px-3 py-2 text-xs">
          <span className="text-foreground font-semibold">Preenchimento progressivo.</span> Na base do Bling, endereço,
          e-mail e telefone aparecem em cerca de 1% dos cadastros. Campo vazio aqui não é erro — é convite.
        </p>
      </div>
    </>
  )
}

const Ausente = () => <span className="text-muted-foreground">—</span>

function Secao({ titulo }: { titulo: string }) {
  return (
    <div className="text-muted-foreground font-heading px-(--ft-pad-x) pt-4 pb-1 text-[10.5px] font-bold tracking-[0.07em] uppercase">
      {titulo}
    </div>
  )
}

function Linha({ rotulo, valor }: { rotulo: string; valor: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 border-b px-(--ft-pad-x) py-1.5 text-[12.5px]">
      <span className="text-muted-foreground w-32 shrink-0 text-[11.5px]">{rotulo}</span>
      <span className="min-w-0 flex-1 truncate">{valor}</span>
    </div>
  )
}
