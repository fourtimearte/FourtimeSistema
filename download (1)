import { MODULOS } from '@/lib/modulos'

/** /kit — os componentes REAIS, nunca uma cópia.
 *  Um kit que é cópia do app diverge; foi o que quebrou o V5 em silêncio. */
export function Kit() {
  return (
    <>
      <Cabecalho
        titulo="/kit"
        descricao="Renderiza os componentes reais do app. Componente novo só está pronto quando tem sua seção aqui — com todas as variantes e estados, nos dois temas e nas duas densidades."
      />

      <Secao titulo="Cores · rampa sequencial" nota="Uma grandeza que cresce: faturamento por mês, intensidade. Varia luminosidade.">
        <Faixa cores={['--chart-1', '--chart-2', '--chart-3', '--chart-4', '--chart-5']} />
      </Secao>

      <Secao
        titulo="Cores · paleta categórica"
        nota="Setores, técnicas, tipos. Varia MATIZ — categorias não podem se distinguir só por claridade: some em P&B e falha em baixa visão."
      >
        <Faixa cores={['--cat-1', '--cat-2', '--cat-3', '--cat-4', '--cat-5', '--cat-6', '--cat-7', '--cat-8']} />
      </Secao>

      <Secao titulo="Cores · estado" nota="O tema neutro do shadcn só traz destructive. Sem estas, cada tela inventa o seu verde.">
        <div className="flex flex-wrap gap-2">
          {(['success', 'warning', 'info', 'destructive'] as const).map((c) => (
            <span
              key={c}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold"
              style={{ background: `var(--${c})`, color: `var(--${c}-foreground)` }}
            >
              {c}
            </span>
          ))}
        </div>
      </Secao>

      <Secao titulo="Tipografia">
        <p className="font-heading text-xl font-semibold">IBM Plex Sans — títulos e o documento A4</p>
        <p className="text-sm">Montserrat — texto corrido da interface</p>
        <p className="font-mono text-sm tabular-nums">Mono — PD004143 · 14.200,00</p>
      </Secao>

      <Secao titulo="Densidade" nota="Muda só espaçamento e altura de controle. Raio, cor e tipografia ficam intactos — por isso a tabela apertada continua parecendo o mesmo sistema.">
        <div className="grid gap-(--ft-gap) md:grid-cols-2">
          {(['confortavel', 'compacta'] as const).map((d) => (
            <div key={d} data-density={d} className="rounded-lg border p-(--ft-card-pad)">
              <div className="text-muted-foreground mb-2 text-[11px] font-semibold tracking-wider uppercase">{d}</div>
              <div className="flex flex-wrap items-center gap-(--ft-gap)">
                <button className="bg-primary text-primary-foreground h-(--ft-control-h) rounded-lg px-3.5 text-[13px] font-medium">
                  Botão
                </button>
                <input
                  defaultValue="Campo"
                  className="border-input bg-background h-(--ft-control-h) rounded-lg border px-2.5 text-[13px]"
                />
                <span className="text-muted-foreground text-xs">linha de tabela: var(--ft-row-h)</span>
              </div>
            </div>
          ))}
        </div>
      </Secao>

      <Secao titulo="Ícones" nota="Um ícone por conceito, nomeado pelo conceito. Emoji não é ícone: não herda a cor do texto nem escala com a tipografia.">
        <div className="flex flex-wrap gap-3">
          {MODULOS.map((m) => (
            <div key={m.rota} className="flex w-24 flex-col items-center gap-1.5 rounded-lg border p-2.5">
              <m.icone className="size-5" />
              <span className="text-muted-foreground truncate text-[10px]">{m.nome}</span>
            </div>
          ))}
        </div>
      </Secao>

      <Secao titulo="Estados" nota="É aqui que mora o trabalho. Botão bonito todo mundo faz; o que quebra em produção é o desabilitado ilegível e a tabela vazia sem explicação.">
        <div className="flex flex-wrap items-center gap-2">
          <button className="bg-primary text-primary-foreground h-(--ft-control-h) rounded-lg px-3.5 text-[13px] font-medium">
            Normal
          </button>
          <button className="bg-primary text-primary-foreground h-(--ft-control-h) rounded-lg px-3.5 text-[13px] font-medium opacity-90">
            Hover
          </button>
          <button className="bg-primary text-primary-foreground ring-ring h-(--ft-control-h) rounded-lg px-3.5 text-[13px] font-medium ring-2 ring-offset-2">
            Foco
          </button>
          <button
            disabled
            className="bg-primary text-primary-foreground h-(--ft-control-h) cursor-not-allowed rounded-lg px-3.5 text-[13px] font-medium opacity-45"
          >
            Desabilitado
          </button>
        </div>
        <div className="max-w-xs">
          <label className="text-muted-foreground mb-1.5 block text-[11.5px] font-semibold">Campo com erro</label>
          <input
            defaultValue="12.345.678/000"
            aria-invalid
            className="border-destructive bg-background h-(--ft-control-h) w-full rounded-lg border px-2.5 text-[13px]"
          />
          <span className="text-destructive mt-1 block text-[11px]">CNPJ incompleto — faltam 4 dígitos</span>
        </div>
        <div className="text-muted-foreground flex flex-col items-center gap-2 rounded-lg border border-dashed p-7 text-center">
          <span className="text-foreground text-[13px] font-semibold">Nenhum pedido ainda</span>
          <span className="text-xs">Estado vazio explica o que fazer e oferece a ação.</span>
        </div>
      </Secao>
    </>
  )
}

function Cabecalho({ titulo, descricao }: { titulo: string; descricao: string }) {
  return (
    <div>
      <h1 className="font-heading text-xl font-semibold">{titulo}</h1>
      <p className="text-muted-foreground mt-0.5 max-w-[70ch] text-[12.5px]">{descricao}</p>
    </div>
  )
}

function Secao({ titulo, nota, children }: { titulo: string; nota?: string; children: React.ReactNode }) {
  return (
    <section className="bg-card rounded-lg border">
      <div className="flex items-center gap-2 border-b px-(--ft-pad-x) py-(--ft-pad-y)">
        <h2 className="font-heading text-[13px] font-semibold">{titulo}</h2>
      </div>
      <div className="flex flex-col gap-3 p-(--ft-card-pad)">
        {nota && <p className="text-muted-foreground border-info border-l-[3px] bg-secondary rounded-r-lg px-3 py-2 text-xs">{nota}</p>}
        {children}
      </div>
    </section>
  )
}

function Faixa({ cores }: { cores: string[] }) {
  return (
    <div className="flex gap-1">
      {cores.map((c) => (
        <div key={c} className="flex-1">
          <div className="h-9 rounded" style={{ background: `var(${c})` }} />
          <div className="text-muted-foreground mt-1 font-mono text-[9px]">{c.replace('--', '')}</div>
        </div>
      ))}
    </div>
  )
}
