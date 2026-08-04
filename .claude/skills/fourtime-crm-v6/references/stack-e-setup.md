# Stack e setup — V6

## Ordem de montagem

```bash
# 1. Vite + React + TS
pnpm create vite@latest fourtime-crm-v6 -- --template react-ts

# 2. Tailwind v4 (plugin do Vite, não PostCSS)
pnpm add tailwindcss @tailwindcss/vite
pnpm add -D @types/node

# 3. shadcn — Base UI é o default desde julho/2026, então não precisa de flag.
#    (Se algum dia for preciso Radix: shadcn init -b radix)
pnpm dlx shadcn@latest init

# 4. Confira que o preset bate com o que foi escolhido
pnpm dlx shadcn@latest preset decode b7AJGDOVg8
```

O alias `@/*` precisa estar em `tsconfig.json`, `tsconfig.app.json` **e** em
`vite.config.ts` (`resolve.alias`). Falta em qualquer um dos três e o shadcn
instala componentes que não importam.

Depois do init, substitua o CSS gerado pelo `assets/tokens-v6.css` desta skill.
Ele já traz o preset com as duas correções e a camada de densidade.

## Dependências por camada, e o porquê de cada uma

### Fundação
```
tailwindcss@4 @tailwindcss/vite
@base-ui-components/react     # vem com o init
class-variance-authority clsx tailwind-merge
tw-animate-css                # substituiu tailwindcss-animate no Tailwind v4
lucide-react
next-themes                   # alternância claro/escuro sem flash na carga
@fontsource/ibm-plex-sans @fontsource/montserrat
```

Self-host das fontes com `@fontsource` em produção. O import do Google Fonts é
uma requisição de terceiro no caminho crítico da primeira pintura — e o sistema
roda em rede de galpão.

### Tabela — a peça central
```
@tanstack/react-table
@tanstack/react-virtual
nuqs
```

**O "Data Table" do shadcn é uma receita, não um componente instalável.** Ele
mostra como combinar `<Table>` com o TanStack Table. Trate isso como decisão de
arquitetura: construa **uma** `<DataTable>` genérica e tipada, e cada tela
declara só suas colunas. Se cada tela montar a sua própria tabela, em três meses
existem cinco comportamentos diferentes de ordenação.

`nuqs` coloca filtro, ordenação e página na URL. Parece detalhe até alguém
precisar mandar "olha esse pedido aqui" no WhatsApp e o link abrir a lista
inteira sem filtro.

`react-virtual` só quando a lista passar de ~200 linhas visíveis. Antes disso é
complexidade sem retorno.

### Formulários
```
react-hook-form zod @hookform/resolvers
react-imask
```

O componente `Field` do shadcn (2026) é a camada de apresentação — rótulo,
descrição, mensagem de erro. `react-hook-form` cuida do estado, `zod` do
schema. Vantagem prática do zod: o mesmo schema valida no cliente e vira tipo
TypeScript, então formulário e API não divergem.

`react-imask` para CEP, CNPJ, CPF e data. As regras de máscara e validação já
existem no sistema antigo (V284–V292) e são portadas como funções puras.

### Estado e navegação
```
@tanstack/react-query
zustand
@tanstack/react-router     # ou react-router v7
```

Separação que evita muita dor: **Query** cuida de dado que vem do servidor
(cache, revalidação, estados de carregando/erro). **Zustand** cuida de estado de
interface (drawer aberto, filtro selecionado, tema). Guardar resposta de API no
Zustand parece simples e vira cache manual escrito à mão.

TanStack Router se você quiser search params tipados — casa direto com a tabela
e com o `nuqs`. React Router v7 se preferir o caminho mais conhecido.

### Interação
```
@dnd-kit/core @dnd-kit/sortable
motion
date-fns
```

`motion` é o antigo framer-motion. Use para transições que **explicam** algo:
card mudando de faixa no Kanban, drawer entrando pelo lado. Não para decoração.

`react-day-picker` já vem junto do `Calendar` do shadcn.

### Gráficos
```
recharts
```

O `Chart` do shadcn é um wrapper de Recharts que injeta os tokens. Configure o
`ChartConfig` apontando para `--chart-*` (sequencial) ou `--cat-*` (categórico)
conforme o caso — ver `tokens-e-cores.md`.

### Qualidade — não deixe para depois
```
eslint prettier prettier-plugin-tailwindcss
@playwright/test @axe-core/playwright
storybook            # opcional: se preferir catálogo fora do app
vitest               # testes das funções portadas
```

`prettier-plugin-tailwindcss` desde o primeiro commit. Ordem de classe divergente
entre arquivos é o primeiro sintoma da divergência visual que derrubou o V5.

`@axe-core/playwright` roda a checagem de acessibilidade junto do teste que já
existe. Contraste e rótulo faltando aparecem no CI em vez de aparecerem no
funcionário.

**Sobre Storybook:** a decisão 4 é kit-como-rota. Storybook é aceitável como
complemento, nunca como substituto — se ele virar a referência, você recriou o
problema do kit separado, agora com mais configuração.

## Ferramentas de agente

Rode dentro do repositório, uma vez:

```bash
pnpm dlx skills add shadcn/ui                 # contexto do seu components.json
pnpm dlx shadcn@latest mcp init --client claude   # instalar componente por MCP
```

A skill oficial faz o agente ler o `components.json` real antes de gerar código,
em vez de escrever shadcn de memória. Vale especialmente aqui, porque a base é
Base UI e boa parte do material que circula por aí ainda assume Radix.

## Estrutura de pastas

```
src/
├── styles/tokens.css          # fonte única — o assets/tokens-v6.css desta skill
├── components/
│   ├── ui/                    # shadcn, como instalado; evite editar
│   └── fourtime/              # componentes de negócio
├── lib/                       # funções PURAS portadas do sistema antigo
│   ├── ft/                    # schema .ft + escada de migração
│   ├── roteamento.ts          # motor de produção
│   ├── mascaras.ts
│   └── bom.ts
├── routes/
│   ├── kit/                   # a rota /kit
│   └── …
├── hooks/
└── store/
```

`components/ui/` é território do shadcn. Precisou de variante nova? Crie um
wrapper em `components/fourtime/` em vez de editar o arquivo instalado — assim
`shadcn add` continua podendo atualizar o componente base sem apagar seu
trabalho.
