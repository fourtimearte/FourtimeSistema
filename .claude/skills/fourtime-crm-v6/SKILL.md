---
name: fourtime-crm-v6
description: Regras do Design Kit V6 e da arquitetura visual do CRM/ERP da Fourtime — React + TypeScript + Vite + Tailwind v4 + shadcn/ui sobre Base UI, estilo Luma, tema neutro com vermelho, IBM Plex Sans + Montserrat, ícones Lucide. Use SEMPRE que a conversa envolver o CRM, ERP, dashboard, Kanban de produção, BOM, estoque, financeiro, tela de clientes ou pedidos da Fourtime; qualquer componente, tela, token, cor, tipografia, densidade, tabela, formulário ou animação desse sistema; a migração do protótipo antigo ou do editor de orçamentos para o React; ou qualquer pergunta sobre "design kit", "V6", "overhaul visual", "tokens", "shadcn" nesse projeto. Use também quando o pedido parecer só "criar uma tela" ou "arrumar o CSS" sem citar o V6 — se o contexto é o sistema da Fourtime, estas regras valem.
---

# Design Kit V6 — CRM/ERP Fourtime

Este é o contrato visual e arquitetural do sistema. Ele existe porque o V5
falhou por um motivo estrutural, não estético: **o kit e o app eram arquivos
diferentes**. O `crm.v4.css` foi portado do HTML sem o bloco `:root`, e no CSS
uma declaração que referencia um `var()` inexistente é **descartada inteira**
pelo navegador. Metade das regras simplesmente deixou de existir, em silêncio,
e a página "não parecia com o HTML".

A lição que organiza tudo aqui: **nada de aparência pode existir em dois
lugares.** Um token tem uma origem. Um componente tem uma implementação. O kit
não é uma cópia do app — é o app.

## As cinco decisões (Henrique, 04/08/2026)

1. **Base UI**, não Radix. É o default do shadcn desde julho/2026.
2. **Estilo Luma**, com uma **camada de densidade própria** nas superfícies de dado.
3. **Tokens corrigidos** — o `--sidebar-primary` roxo do dark sai; entra paleta categórica.
4. **O kit é uma rota** (`/kit`) dentro do app, renderizando os componentes reais.
5. **Zero reaproveitamento visual.** Nenhuma linha de CSS do FourtimeSistema atravessa.
   Só comportamento e lógica são portados.

Se um pedido contraria uma dessas, não improvise: diga qual decisão está sendo
contrariada e pergunte. Elas foram tomadas depois de um overhaul que deu errado.

## Comece por aqui

Antes de escrever componente, confira o preset real em vez de confiar na memória:

```bash
pnpm dlx shadcn@latest preset decode b7AJGDOVg8
```

Ele devolve `baseColor, theme, chartColor, iconLibrary, font, fontHeading,
radius, menuAccent, menuColor` — a verdade do que o Henrique escolheu no
ui.shadcn.com/create. Se o que você ia escrever diverge do decode, o decode
ganha.

O preset escolhido, em palavras: **Luma · Neutral · chart Red · IBM Plex Sans
(títulos) · Montserrat (texto) · Lucide · radius Small (0.45rem) · menu Default/Solid ·
menu accent Subtle.**

## Regra 1 — a fonte única dos tokens

Todo valor de aparência nasce em `src/styles/tokens.css` e em nenhum outro
lugar. O arquivo pronto e já corrigido está em `assets/tokens-v6.css` — copie-o,
não redigite os valores oklch de cabeça.

Em componente, **nunca** apareça cor literal. Nem `#hex`, nem `oklch(...)`, nem
`rgb()`. Sempre a classe semântica do Tailwind que aponta para o token
(`bg-card`, `text-muted-foreground`, `border-border`). O motivo é o tema escuro:
um `#1a1a1a` cravado num componente não sabe que o tema mudou, e o bug só
aparece semanas depois, numa tela que ninguém estava olhando.

Duas correções em relação ao que veio do gerador, e por quê:

- **`--sidebar-primary` no `.dark`** vinha `oklch(0.488 0.243 264.376)` — azul-roxo,
  sobra do default do shadcn. Num sistema preto-e-vermelho isso acende um item
  de menu ativo roxo. Corrigido para o neutro claro, coerente com o `:root`.
- **`--chart-1..5` são todos vermelhos** — é uma rampa *sequencial* (só varia
  luminosidade). Serve para intensidade ("faturamento por mês"). Não serve para
  *categorias*: cinco setores de produção todos em vermelho se distinguem apenas
  por claridade, e isso quebra para quem tem baixa visão, além de virar papa em
  impressão P&B. Por isso o V6 tem **duas** paletas de dados, com usos separados
  — ver `references/tokens-e-cores.md`.

## Regra 2 — Luma é espaçoso; grade de dados não é

Luma é descrito pelo próprio shadcn como *"rounded geometry, soft elevation,
breathable layouts"*. É um estilo que respira. E o CRM tem Kanban de produção,
grade de pedidos, BOM e estoque — telas que precisam mostrar muita linha.

A saída **não** é misturar dois estilos (isso destrói a unidade e é exatamente o
anti-padrão que o V5 já pagou). A saída é uma camada de densidade que muda
**apenas espaçamento e altura de controle**, preservando raio, cor, sombra e
escala tipográfica. Assim a tabela é apertada mas continua sendo, visivelmente,
o mesmo sistema do cadastro.

```tsx
<div data-density="compacta">
  <DataTable … />
</div>
```

Três regras que fazem isso não virar bagunça:

- Densidade se aplica a um **container**, nunca a um componente solto. Meia
  tabela compacta dentro de um card confortável lê como defeito.
- Densidade **não** muda raio, cor nem tipografia. Só `--ft-control-h`,
  `--ft-row-h`, `--ft-pad-*` e `--ft-gap`.
- Em ponteiro grosso (`@media (pointer: coarse)`) a densidade **volta sozinha
  para confortável**. Uma linha de 28px é ótima com mouse e impossível com o
  dedo — o alvo mínimo de toque é 44×44px, e no galpão o sistema é usado no
  celular. Isso já está no `tokens-v6.css`; não desative.

Detalhes e a tabela completa de valores: `references/densidade-e-luma.md`.

## Regra 3 — o kit é uma rota, não um arquivo

`/kit` é uma rota do próprio app que importa e renderiza os **componentes
reais**, um por seção, com todas as variantes, estados (normal, hover, focus,
disabled, loading, erro, vazio), tamanhos, nos dois temas e nas duas densidades.

Nunca recrie um componente "para o kit". Se aparecer no kit uma versão
simplificada de um botão, o kit começou a mentir naquele instante — e a mentira
só é descoberta quando alguém confia nela.

Consequência prática: componente novo só está pronto quando tem sua seção em
`/kit`. É lá que se revisa visual, não em screenshot da tela de produção.

Como organizar as seções e o que cada verbete precisa mostrar:
`references/kit-rota.md`.

## Regra 4 — o que se porta do sistema antigo (e o que não)

**Não atravessa nada de aparência.** Nenhum `.css`, nenhuma classe do
`kit.css`/`tokens.css` v5, nenhum estilo inline, nenhuma constante de estilo em
`.tsx`, nenhuma medida copiada "porque ficava bom". Se você se pegar abrindo um
arquivo do FourtimeSistema para ver como uma tela era, feche: a referência do V6
é o `/kit`.

**Atravessa comportamento e lógica**, e essa parte é valiosa — está testada e
paga em produção:

- o motor de roteamento de produção (aprovar → lê `layout.design[]` → gera cards nas faixas);
- a escada de migração do `.ft` (`FT_MIGRACOES` / `migraDoc()` / `completaPadroes()`);
- máscaras e validações de CEP, CNPJ, CPF, data;
- cálculo de BOM, baixa de estoque, regras de preço;
- a lógica de mesclagem do banco (união + lápides).

O jeito de portar: extrair para **função pura** em `src/lib/`, sem tocar DOM,
sem `document`, sem classe CSS, com teste unitário. Se a função só funciona
porque lê um seletor de tela, ela não foi portada — foi mudada de lugar.

## Regra 5 — o `.ft` é inviolável

O editor de orçamentos v3xx continua no ar, funcionários salvando `.ft` todo
dia, e um `.ft` salvo hoje precisa abrir daqui a dez anos. O V6 é **consumidor**
do formato, nunca dono. Quatro regras que não se negociam:

1. Campo que existe nunca é removido nem renomeado — só se acrescenta.
2. Campo ausente vira padrão, nunca erro.
3. Mudança estrutural ganha um degrau novo em `FT_MIGRACOES`.
4. Um `.ft` nunca é lido direto: passa sempre por `migraDoc()`.

Cuidado específico do V6: `obs` e `anotacoes` guardam **innerHTML** gerado pelo
editor antigo, com a formatação do editor antigo. Como o V6 não herda CSS
nenhum, esse HTML chega sem estilo. Ele precisa de um contêiner de prosa
dedicado (`shadcn/typeset` resolve isso) e de sanitização antes de renderizar —
nunca `dangerouslySetInnerHTML` cru. Ver `references/arquitetura-e-dados.md`.

## Regra 6 — o que a stack precisa ter

O esqueleto é React + TS + Vite + Tailwind v4 + shadcn/ui. Isso sozinho não
constrói um CRM. A lista comentada do que instalar, por camada e com o motivo de
cada escolha, está em `references/stack-e-setup.md`. Dois pontos que costumam
ser esquecidos e doem depois:

- **O "Data Table" do shadcn é uma receita sobre o TanStack Table**, não um
  componente que se instala pronto. Planeje-o como peça de arquitetura: uma
  `<DataTable>` genérica e tipada, com colunas declaradas por tela.
- **`prettier-plugin-tailwindcss`** desde o primeiro commit. Ordem de classe
  divergente é o começo silencioso da divergência visual.

## Antes de dar qualquer tela por pronta

Não é burocracia — cada item abaixo é um defeito que já aconteceu neste projeto
ou é o modo de falha clássico da tela em questão:

- [ ] Zero cor literal fora do `tokens.css`
- [ ] Claro e escuro conferidos na tela inteira (o dark é onde os tokens errados aparecem)
- [ ] Contraste de texto ≥ 4.5:1 nos dois temas
- [ ] Foco visível em tudo que recebe teclado — nunca `outline: none` sem substituto
- [ ] Ícones em SVG (Lucide). Emoji não é ícone
- [ ] Alvo de toque ≥ 44×44px onde há ponteiro grosso
- [ ] Estados vazio, carregando e erro desenhados — não só o caso feliz
- [ ] Transições entre 150–300ms; `prefers-reduced-motion` respeitado
- [ ] Sem rolagem horizontal em 390px; grade rola dentro do próprio contêiner
- [ ] Item de grid com `min-width: 0` (foi o que estourou o layout mobile no V5)
- [ ] Seção correspondente criada ou atualizada no `/kit`

## Arquivos de referência

Leia sob demanda, quando o assunto aparecer:

| Arquivo | Quando abrir |
|---|---|
| `assets/tokens-v6.css` | montar o projeto, ou qualquer dúvida de valor de token |
| `references/tokens-e-cores.md` | cor, tema, paleta de gráfico, cores de setor |
| `references/densidade-e-luma.md` | tabela, Kanban, grade, qualquer tela densa |
| `references/kit-rota.md` | criar/organizar a rota `/kit`, catalogar um componente |
| `references/stack-e-setup.md` | instalar dependência, montar o projeto do zero |
| `references/arquitetura-e-dados.md` | `.ft`, migração do banco, pastas, portar lógica |
