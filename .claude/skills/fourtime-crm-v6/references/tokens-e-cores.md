# Tokens e cores — V6

## As duas paletas de dados, e por que são duas

O preset entrega `--chart-1..5` todos em vermelho, variando só a luminosidade.
Isso é uma rampa **sequencial**, e é ótima para o que ela é: uma grandeza que
cresce. Faturamento por mês, volume por semana, intensidade de um mapa de calor.
A leitura "mais escuro = mais" é imediata.

O erro comum é usar essa mesma rampa para **categorias**. Cinco setores de
produção pintados em cinco vermelhos diferentes obrigam o leitor a comparar
claridade — que é a dimensão perceptual mais fraca que existe. Some numa
impressão em preto e branco, some para quem tem baixa visão, e mesmo com visão
perfeita ninguém consegue dizer se `chart-3` é o Corte ou a Costura sem voltar
na legenda toda vez.

Por isso o V6 tem `--cat-1..8`: luminosidade e croma quase constantes, **matiz**
variando. É a dimensão que o olho separa sem esforço.

| Situação | Paleta |
|---|---|
| Faturamento mês a mês, uma série | `--chart-1..5` |
| Mapa de calor, intensidade | `--chart-1..5` |
| Pedidos por setor, pizza de categorias | `--cat-1..8` |
| Tarja de setor no card do Kanban | `--cat-1..8` |
| Barras empilhadas por tipo de produto | `--cat-1..8` |

**Regra que vale para as duas:** cor nunca é o único portador da informação.
Legenda, rótulo ou ícone sempre acompanham. Se a informação some quando o
gráfico é impresso em preto e branco, ela não estava lá.

## Cor não é o único sinal de status

`--success`, `--warning`, `--info` e `--destructive` existem para dar consistência,
não para carregar sozinhos o significado. Um badge "Atrasado" precisa dizer
"Atrasado" — não bastar ser vermelho. Um campo com erro precisa da mensagem
perto do campo, não só da borda vermelha.

Isso não é só acessibilidade: no chão de fábrica o sistema é olhado de longe, em
tela com brilho ruim, às vezes com luz do sol batendo.

## Amarelo/laranja precisa de texto escuro

`--warning` e `--cat-3` (ocre) são claros o bastante para que texto branco em
cima falhe o contraste. Por isso `--warning-foreground` é escuro no tema claro.
Sempre use o par `--x` + `--x-foreground` junto; nunca escolha a cor do texto
"no olho".

## Contraste — o que conferir

- Texto normal sobre o fundo: **≥ 4.5:1**
- Texto grande (≥ 24px, ou ≥ 19px em negrito): **≥ 3:1**
- Borda de componente e indicador de foco: **≥ 3:1** contra o vizinho

O ponto que mais falha na prática é `--muted-foreground` sobre `--muted`: cinza
médio em cima de cinza claro. Antes de usar essa combinação para algo que
precisa ser lido (não só decorativo), confira.

## Modo escuro não é inversão

Note nos tokens que o escuro não é o claro de cabeça para baixo:

- `--card` no escuro é **mais claro** que `--background` (0.205 vs 0.145). No
  claro os dois são branco e a separação vem da borda. Elevação no escuro se faz
  com luminosidade, não com sombra — sombra preta sobre fundo preto não existe.
- `--border` no escuro é `oklch(1 0 0 / 10%)`, branco translúcido, não um cinza
  opaco. Assim a borda funciona sobre qualquer superfície.
- As categóricas sobem de L ≈ 0.58 para L ≈ 0.72. Uma cor calibrada para
  contrastar com branco desaparece contra preto.

Toda tela é conferida nos dois temas antes de ser dada por pronta. O tema escuro
é onde token errado aparece — foi assim que o `--sidebar-primary` roxo passou
despercebido no preset.

## Cores de marca externa

`--whatsapp` está nos tokens porque é uma cor que **não é nossa decisão** — é da
marca do WhatsApp e precisa ser reconhecível. Cores assim ficam nomeadas e
isoladas, nunca dissolvidas no sistema. Se um dia entrar Instagram ou Mercado
Pago, mesmo tratamento.
