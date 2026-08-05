import { useState } from 'react'
import {
  ArrowRight, Calendar, ChevronRight, Coffee, CreditCard, Plus, ShoppingCart, Upload,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemSeparator, ItemTitle } from '@/components/ui/item'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Bloco, Porque, SecaoKit } from './pecas'

/** Os arranjos recorrentes da página de referência do ui.shadcn
 *  (preset b7AJGDOVg8). São eles que dão a cara do sistema — e é aqui que
 *  se decide como um número grande, uma lista e um formulário se parecem,
 *  para que toda tela nova já nasça igual. */
const MOEDAS = [
  { value: 'brl', label: 'BRL — Real brasileiro' },
  { value: 'usd', label: 'USD — Dólar americano' },
]

export function Composicao() {
  const [minimo, setMinimo] = useState(2500)
  const [publico, setPublico] = useState(true)
  const [email, setEmail] = useState(true)

  return (
    <SecaoKit
      id="composicao"
      numero="11"
      titulo="Arranjos de módulo"
      lead={
        <>
          Os arranjos da página de referência do <code>ui.shadcn.com/create</code>. Cada tela nova do sistema deve ser
          montada a partir daqui — não é sugestão, é o padrão. Um módulo é sempre um <code>Card</code>; dentro dele
          moram estes cinco arranjos e nada mais.
        </>
      }
    >
      <div className="grid items-start gap-4 lg:grid-cols-3">
        {/* 1 — MÉTRICA */}
        <Card>
          <CardHeader>
            <CardTitle>Metas de produção</CardTitle>
            <CardDescription>Marcos ativos para 2026</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {[
              { rotulo: 'FATURAMENTO', valor: 'R$ 420.000', pct: 65, feito: 'R$ 273.000' },
              { rotulo: 'PEÇAS', valor: '85.000', pct: 32, feito: '27.200' },
            ].map((m) => (
              <div key={m.rotulo} className="bg-secondary flex flex-col gap-2 rounded-2xl p-4">
                <span className="text-muted-foreground text-[10.5px] font-semibold tracking-[0.08em] uppercase">
                  {m.rotulo}
                </span>
                <span className="font-mono text-2xl leading-none font-semibold tabular-nums">{m.valor}</span>
                {/* Progress já monta Track + Indicator por dentro; passar os
                    dois como filhos desenha a barra duas vezes. */}
                <Progress value={m.pct} className="mt-1 [&_[data-slot=progress-track]]:h-1.5" />
                <div className="text-muted-foreground flex justify-between text-[11px]">
                  <span>{m.pct}% alcançado</span>
                  <span className="font-mono tabular-nums">{m.feito}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 2 — FORMULÁRIO */}
        <Card>
          <CardHeader>
            <CardTitle>Limite de repasse</CardTitle>
            <CardDescription>Saldo mínimo antes de disparar o repasse.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-[12px] font-medium">Moeda</span>
              {/* `items` é o que faz o gatilho mostrar o RÓTULO em vez do
                  valor cru: sem ele o campo exibe "brl". */}
              <Select defaultValue="brl" items={MOEDAS}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MOEDAS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between">
                <span className="text-[12px] font-medium">Valor mínimo</span>
                <span className="font-mono text-xl font-semibold tabular-nums">
                  R$ {minimo.toLocaleString('pt-BR')}
                </span>
              </div>
              <Slider value={[minimo]} min={50} max={10000} step={50} onValueChange={(v) => setMinimo((v as number[])[0])} />
              <div className="text-muted-foreground flex justify-between font-mono text-[11px]">
                <span>R$ 50 (MÍN)</span>
                <span>R$ 10.000 (MÁX)</span>
              </div>
            </div>
            <Button className="w-full">Salvar limite</Button>
          </CardContent>
        </Card>

        {/* 3 — SALDO + VAZIO */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardDescription>Saldo a receber</CardDescription>
              <CardTitle className="font-mono text-3xl font-semibold tabular-nums">R$ 0,00</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <span className="bg-secondary text-muted-foreground inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium">
                <span className="bg-warning size-1.5 rounded-full" />
                Configuração pendente
              </span>
              <div className="bg-secondary flex flex-col gap-2 rounded-2xl p-3.5 text-[12px]">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Líquido</span>
                  <span className="font-mono tabular-nums">R$ 0,00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Taxa</span>
                  <span className="font-mono tabular-nums">-R$ 0,00</span>
                </div>
                <div className="mt-1 flex justify-between border-t pt-2 font-semibold">
                  <span>Pronto para sacar</span>
                  <span className="font-mono tabular-nums">R$ 0,00</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-2 text-center">
              <div className="bg-secondary grid size-10 place-items-center rounded-2xl">
                <Plus className="size-4" />
              </div>
              <span className="font-heading text-base font-medium">Nenhum layout ainda</span>
              <p className="text-muted-foreground max-w-[34ch] text-[12px]">
                Suba o primeiro mockup para começar a montar orçamentos.
              </p>
              <Button size="sm" className="mt-1">
                <Upload /> Enviar mockup
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Bloco titulo="Lista de itens" nota="transações, ajustes, qualquer coisa com ícone + título + apoio">
        <ItemGroup>
          {[
            { i: Coffee, t: 'Blue Bottle Coffee', d: 'Alimentação', q: 'Hoje, 10:24', v: '-R$ 6,50', neg: true },
            { i: ShoppingCart, t: 'Atacadão Tecidos', d: 'Insumos', q: 'Ontem', v: '-R$ 1.423,00', neg: true },
            { i: CreditCard, t: 'Repasse Stripe', d: 'Receita', q: '12 out', v: '+R$ 4.200,00', neg: false },
          ].map((r, n, arr) => (
            <div key={r.t}>
              <Item>
                <ItemMedia className="bg-secondary size-9 rounded-2xl">
                  <r.i className="size-4" />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>{r.t}</ItemTitle>
                  <ItemDescription>{r.d}</ItemDescription>
                </ItemContent>
                <ItemActions className="gap-4">
                  <span className="text-muted-foreground hidden text-[12px] sm:inline">{r.q}</span>
                  <span className={`font-mono text-[13px] tabular-nums ${r.neg ? '' : 'text-success font-semibold'}`}>
                    {r.v}
                  </span>
                </ItemActions>
              </Item>
              {n < arr.length - 1 && <ItemSeparator />}
            </div>
          ))}
        </ItemGroup>
        <Porque>
          A miniatura à esquerda é um quadrado de raio 2xl com fundo <code>secondary</code>, nunca o ícone solto. É o
          que dá o ritmo vertical da lista: sem a caixa, cada linha tem uma altura diferente conforme o ícone.
        </Porque>
      </Bloco>

      <Bloco titulo="Lista de navegação" nota="ajuste com descrição e seta">
        <ItemGroup>
          {[
            { i: ArrowRight, t: 'Alterar limite de transferência', d: 'Ajuste quanto pode sair do seu saldo.' },
            { i: Calendar, t: 'Transferências agendadas', d: 'Programe um envio para uma data futura.' },
          ].map((r) => (
            <Item key={r.t} className="bg-secondary mb-2 rounded-2xl" render={<button type="button" />}>
              <ItemMedia variant="icon">
                <r.i />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>{r.t}</ItemTitle>
                <ItemDescription>{r.d}</ItemDescription>
              </ItemContent>
              <ItemActions>
                <ChevronRight className="text-muted-foreground size-4" />
              </ItemActions>
            </Item>
          ))}
        </ItemGroup>
      </Bloco>

      <Bloco titulo="Preferências" nota="rótulo + explicação à esquerda, chave à direita">
        <div className="flex flex-col gap-1">
          {[
            { t: 'Estatísticas públicas', d: 'Permitir que outros vejam o total produzido.', v: publico, set: setPublico },
            { t: 'Avisos por e-mail', d: 'Receber um resumo diário dos pedidos atrasados.', v: email, set: setEmail },
          ].map((s) => (
            <label key={s.t} className="flex cursor-pointer items-start gap-4 border-b py-3 last:border-b-0">
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-medium">{s.t}</span>
                <span className="text-muted-foreground block text-[11.5px]">{s.d}</span>
              </span>
              <Switch checked={s.v} onCheckedChange={s.set} />
            </label>
          ))}
        </div>
        <Porque>
          A chave fica <b>à direita e sozinha</b>, alinhada ao topo do bloco de texto. Nunca à esquerda: a coluna da
          esquerda é onde o olho procura o nome da coisa, e uma fileira de chaves ali vira uma parede sem sentido.
        </Porque>
      </Bloco>

      <Bloco titulo="Campo com prefixo" nota="valor monetário e unidade">
        <div className="flex max-w-[320px] flex-col gap-1.5">
          <span className="text-[12px] font-medium">Valor a investir</span>
          <div className="bg-input/50 flex h-(--ft-control-h) items-center gap-2 rounded-3xl px-3.5">
            <span className="text-muted-foreground font-mono text-[13px]">R$</span>
            <Input defaultValue="1.000,00" className="h-auto rounded-none bg-transparent px-0 font-mono" />
          </div>
        </div>
        <Porque>
          O prefixo mora <b>dentro</b> do campo, não num rótulo ao lado. O usuário digita o número onde o símbolo já
          está, e o campo continua sendo um alvo de clique só.
        </Porque>
      </Bloco>
    </SecaoKit>
  )
}
