# Luma + densidade própria

## O problema, dito honestamente

Luma foi desenhado com "geometria arredondada, elevação suave, layouts que
respiram — inspirado no macOS Tahoe, sem o vidro". É lindo e é **espaçoso**.

O CRM da Fourtime tem Kanban de produção com dezenas de cards, grade de pedidos,
BOM com linhas de insumo, estoque, financeiro. Telas que existem para mostrar
muita informação de uma vez. Com o espaçamento nativo do Luma, uma grade de
pedidos mostra metade das linhas que deveria, e o operador rola o dia inteiro.

A tentação é misturar: Luma nas telas bonitas, um estilo compacto (Mira, Nova)
nas grades. **Não faça isso.** Dois estilos no mesmo produto é exatamente o
anti-padrão que já custou caro aqui — o sistema deixa de parecer um sistema.

## A saída

Uma única camada de densidade, aplicada por container, que mexe **só** em
espaçamento e altura de controle:

```tsx
<Card>
  <CardHeader>Pedidos em aberto</CardHeader>
  <CardContent data-density="compacta">
    <DataTable columns={colunas} data={pedidos} />
  </CardContent>
</Card>
```

O raio continua 0.45rem. As cores continuam as mesmas. A escala tipográfica
continua a mesma. A sombra continua a mesma. Só as medidas de respiro encolhem.
O resultado é uma tabela apertada que ainda lê, visivelmente, como o mesmo
sistema do formulário de cadastro ao lado.

## A tabela de valores

| Token | Confortável | Compacta | Compacta em toque |
|---|---|---|---|
| `--ft-control-h` | 36px | 30px | 44px |
| `--ft-control-h-sm` | 32px | 26px | 40px |
| `--ft-row-h` | 48px | 36px | 52px |
| `--ft-pad-x` | 16px | 10px | 16px |
| `--ft-pad-y` | 12px | 6px | 12px |
| `--ft-gap` | 16px | 8px | 12px |
| `--ft-card-pad` | 24px | 14px | 20px |

## Três regras que impedem isso de virar bagunça

**1. Densidade se aplica a um container, nunca a um componente solto.**
Meia tabela compacta dentro de um card confortável não lê como escolha — lê como
defeito. O container é o card, o painel, a seção. Nunca o botão.

**2. Densidade não muda raio, cor nem tipografia.**
Se você se pegar escrevendo `[data-density="compacta"] { --radius: … }`, pare.
Nesse momento você não está mudando a densidade, está criando um segundo estilo.

**3. Ponteiro grosso volta para confortável, automaticamente.**
Já está no `tokens-v6.css` via `@media (pointer: coarse)`. Trinta pixels de
altura é confortável com mouse e impossível com o dedo — o alvo mínimo de toque
é 44×44px, e o sistema é usado no celular dentro do galpão. Não desative essa
regra para "ficar igual ao desktop": o desktop e o celular não têm o mesmo dedo.

## Onde usar qual

| Superfície | Densidade |
|---|---|
| Grade de pedidos, clientes, estoque | compacta |
| Linhas de insumo da BOM | compacta |
| Coluna do Kanban | compacta |
| Formulário de cadastro, modal de edição | confortável |
| Dashboard, cards de KPI | confortável |
| Login, configurações, telas de leitura | confortável |

A pergunta que decide: *o valor desta tela está em ver muitos itens ao mesmo
tempo, ou em preencher um item com cuidado?* Ver muitos → compacta. Preencher
com cuidado → confortável.

## Movimento no Luma

Luma tem transições suaves por natureza, e isso combina com o estilo. Mas há um
detalhe que vale conhecer: **easing com overshoot (`back.out`, molas
exageradas) em tabela de dados lê como desleixo.** Uma linha que "quica" ao
entrar sugere brincadeira numa tela onde o operador procura um número.

- Tabela, grade, lista: fade + deslocamento pequeno, sem overshoot, 150–200ms.
- Drawer, modal, painel: pode ter mola discreta, 250–300ms.
- Card do Kanban ao mudar de faixa: o movimento deve mostrar *de onde veio para
  onde foi* — continuidade espacial é o que faz o operador entender o que
  aconteceu sem ler nada.

Animação sem função, aqui, é ruído. A pergunta antes de animar: *isso explica
alguma coisa?* Se não explica, corte.

`prefers-reduced-motion` é respeitado globalmente no `tokens-v6.css`. Não
escreva animação que ignore isso.
