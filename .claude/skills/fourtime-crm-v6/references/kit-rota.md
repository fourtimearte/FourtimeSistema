# O kit é uma rota

## Por que rota, e não arquivo

O kit v5 era um HTML separado. O app era outro. Eles divergiram — e a
divergência não apareceu como "está diferente", apareceu como *"o CSS da página
de clientes está todo quebrado"*, semanas depois, porque um bloco de tokens não
tinha sido copiado junto e o navegador descartou em silêncio toda declaração que
dependia dele.

Um kit que é uma cópia do app **vai** divergir. Não é questão de disciplina. A
única forma de garantir que o kit diz a verdade é ele ser feito das mesmas peças
que o app.

Então: `/kit` é uma rota do app, que importa os componentes de
`@/components/ui/` e os renderiza. Se o botão muda, o kit muda no mesmo commit,
porque é o mesmo botão.

## O que cada verbete precisa mostrar

Um componente só está catalogado quando o kit mostra:

- **todas as variantes** (default, secondary, outline, ghost, destructive…)
- **todos os tamanhos**
- **os estados**: normal, hover, foco por teclado, ativo, desabilitado,
  carregando, erro, vazio
- **os dois temas** (o seletor fica no topo da rota)
- **as duas densidades**, quando fizer diferença para aquele componente

Os estados são onde mora o trabalho de verdade. Botão bonito todo mundo faz; o
que quebra em produção é o botão desabilitado com contraste ilegível, o input em
erro sem mensagem, a tabela vazia que aparece como um retângulo branco sem
explicação. Se o kit não mostra esses estados, ninguém os desenha — e eles
aparecem no dia em que o cliente tem zero pedidos.

## Estrutura sugerida da rota

```
/kit
├── Fundamentos
│   ├── Cores          — cada token, nome, valor, e onde usar
│   ├── Tipografia     — escala completa, IBM Plex Sans vs Montserrat
│   ├── Raio e sombra
│   ├── Espaçamento e densidade  — as duas lado a lado, para comparar
│   └── Ícones         — o subconjunto Lucide que o sistema usa, nomeado
├── Componentes base   — os do shadcn, como instalados
├── Padrões            — combinações recorrentes:
│   ├── Grade padrão   (DataTable + filtros + paginação + vazio + carregando)
│   ├── Formulário padrão (Field + validação + erro + salvar)
│   ├── Cabeçalho de página
│   └── Drawer de detalhe
├── Componentes Fourtime — os de negócio:
│   ├── CardPedido, TarjaSetor, BadgeStatus
│   ├── ChipTecido, SeletorCor, GradeTamanhos
│   └── ValorBRL, MascaraCNPJ, MascaraCEP
└── Dados              — gráficos com as duas paletas, e quando usar cada
```

A seção **Padrões** é a que mais economiza tempo depois. Uma "grade padrão"
resolvida uma vez — com filtro, ordenação, paginação, estado vazio, estado
carregando, erro de rede — evita que cada tela reinvente a sua, cada uma um
pouco diferente. É aí que a consistência realmente acontece; nos componentes
base ela vem de graça do shadcn.

## Ícones: escolher uma vez

Lucide tem mais de mil ícones. Se cada tela escolhe o seu, o sistema fica com
três ícones diferentes para "editar". A seção de ícones do kit define o
vocabulário: um ícone por conceito, nomeado pelo conceito e não pelo desenho.

```
editar → Pencil        excluir → Trash2       duplicar → Copy
buscar → Search        filtrar → SlidersHorizontal
aprovar → Check        recusar → X            atenção → TriangleAlert
pedido → FileText      cliente → User         estoque → Package
```

Ícone sozinho, sem rótulo visível, precisa de `aria-label`. Um botão que é só um
lixeirinha não diz nada para leitor de tela — e, na prática, também não diz nada
para o funcionário novo.

E emoji não é ícone. Emoji renderiza diferente em cada sistema operacional, não
herda a cor do texto e não escala com a tipografia.

## Definição de pronto

Componente novo está pronto quando tem sua seção no `/kit`. A revisão visual
acontece lá, não em screenshot da tela de produção — na tela de produção você vê
um estado; no kit você vê todos.
