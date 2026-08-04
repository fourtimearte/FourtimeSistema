# Arquitetura, portabilidade de lógica e migração de dados

## Parte 1 — o que atravessa do sistema antigo

**Nada de aparência.** Nenhum `.css`, nenhuma classe do `kit.css` ou do
`tokens.css` v5, nenhum estilo inline, nenhuma constante de estilo em `.tsx`,
nenhuma medida copiada. A referência visual do V6 é a rota `/kit` e só ela.

**Comportamento atravessa**, e vale muito — é código testado, pago em produção:

| O que | Onde vai morar |
|---|---|
| Motor de roteamento (aprovar → `layout.design[]` → cards nas faixas) | `lib/roteamento.ts` |
| Escada de migração do `.ft` (`FT_MIGRACOES`, `migraDoc`, `completaPadroes`) | `lib/ft/` |
| Máscaras e validações (CEP, CNPJ, CPF, data) | `lib/mascaras.ts` |
| Cálculo de BOM, baixa de estoque, regras de preço | `lib/bom.ts` |
| Mesclagem do banco (união + lápides) | `lib/merge.ts` |

**Como portar:** extraia para função **pura** — entra dado, sai dado. Sem
`document`, sem seletor, sem classe CSS, sem efeito colateral. Escreva o teste
com casos reais antes de conectar na tela.

O teste de que a portabilidade foi feita direito: a função roda em Node, num
teste, sem nenhum DOM. Se ela só funciona porque lê `.combo-ref textarea`, ela
não foi portada — foi mudada de arquivo, e trouxe junto o acoplamento com o
visual antigo que o V6 está justamente descartando.

## Parte 2 — o `.ft` é inviolável

O editor v3xx continua no ar. Funcionários salvam `.ft` todo dia. Um `.ft` salvo
hoje precisa abrir daqui a dez anos. O V6 é **consumidor** do formato, nunca
dono.

1. Campo que existe nunca é removido nem renomeado — só se acrescenta.
2. Campo ausente vira padrão, nunca erro.
3. Mudança estrutural ganha degrau novo em `FT_MIGRACOES`.
4. Um `.ft` nunca é lido direto: passa sempre por `migraDoc()`.

Antes de escrever o importador, extraia de 3 a 5 `.ft` reais e guarde como
*golden files*. O teste que abre cada um e confere o estado resultante é a
garantia mecânica de que arquivo de hoje abre amanhã. Sem ele, a promessa da
década é só intenção.

### O ponto que dói especificamente no V6

`obs` e `anotacoes` guardam **innerHTML** produzido pelo `contenteditable` do
editor antigo, formatado pelo CSS do editor antigo. Como o V6 não herda CSS
nenhum (decisão 5), esse HTML chega sem estilo — listas sem marcador, negrito
que pode vir como `<b>` ou `<span style>`, quebras inconsistentes.

Duas providências, não uma:

- **Sanitizar** antes de renderizar. Nunca `dangerouslySetInnerHTML` com
  conteúdo cru: é HTML que veio de arquivo, e arquivo pode ser editado à mão.
- **Um contêiner de prosa dedicado** que estiliza tags legadas dentro de um
  escopo (`shadcn/typeset` existe exatamente para isso). Estilizar `<b>` e `<ul>`
  globalmente contamina o resto do app.

`img` guarda base64 — é auto-contido e seguro do ponto de vista do formato, mas
pesado. Ver a parte 3.

## Parte 3 — migrar o banco: o que esperar

Resposta curta: **é migrável, o `.ft` é a parte fácil, e o risco real está
concentrado no `fourtime-banco.json`.** Nenhum problema é impeditivo, mas um
deles precisa ser decidido antes da primeira linha de importador.

### O que existe hoje, de fato

Não é um banco relacional. São três coisas:

1. **`fourtime-banco.json` no Google Drive** — o cadastro global (clientes,
   tecidos, cores, referências…). Um único JSON `{rev, data}`, onde `data` é um
   dicionário de categoria → lista de itens. Toda gravação é uma **união**: o que
   cada um acrescenta se soma, ninguém apaga por omissão. Exclusões são
   **lápides** em `_removidos`, e só o admin pode criá-las.
2. **Arquivos `.ft` no Drive** — um por orçamento, organizados em
   `ANO > "ANO - MM - MÊS"` e na "Pasta de Trabalho".
3. **SQLite no Render** — apenas cache. O disco do Render é apagado a cada deploy
   e a cada hibernação; a verdade mora no Drive.

### O problema que precisa de decisão: não existe identificador

A chave de mesclagem é o **nome** do item, em maiúsculas
(`_chave(item) = item["n"].strip().upper()`). Isso tem três consequências que a
migração herda:

- **Renomear cria um registro novo.** "Cliente ACME" virou "ACME LTDA"? São dois.
- **Dois itens de mesmo nome são um só.** Dois clientes homônimos já estão
  fundidos no banco de hoje, e nada no arquivo diz que eram dois.
- **A chave é sensível a acento.** "JOÃO" e "JOAO" são registros distintos.

No Postgres cada linha precisa de um `uuid` estável. Isso se resolve *cunhando*
o UUID no momento da importação e nunca mais chaveando por nome. Mas o
importador precisa **relatar** os casos ambíguos em vez de decidir sozinho:
duplicatas por acento, nomes quase iguais, itens sem nome. Isso é uma planilha
de conferência para o Henrique, não uma heurística automática — fundir dois
clientes que eram diferentes é irreversível.

### Os outros pontos, em ordem de importância

**Convivência de dois escritores.** Enquanto o editor estiver no ar (e ele vai
ficar), o mesmo cadastro terá dois donos: o `fourtime-banco.json` e o Postgres.
A recomendação é o Postgres virar a fonte da verdade e o `server.py` continuar
servindo `/api/db` como **projeção** dele — o editor não muda uma linha e não
percebe. A alternativa (dois bancos sincronizando nos dois sentidos) é a receita
clássica de divergência silenciosa.

**Lápides não podem ser descartadas.** `_removidos` precisa virar `deleted_at`
na tabela, não sumir. Se o registro apagado simplesmente não for importado e
depois o editor sincronizar, o item **ressuscita** — foi exatamente o bug que a
mesclagem com lápides foi criada para resolver.

**Não há histórico por item.** Só existe um `rev` global e um `atualizado`
global. Não dá para reconstruir quando um cliente foi cadastrado nem por quem —
não existe identidade de usuário no sistema atual, só um token compartilhado.
Todo `created_at`/`created_by` do CRM começa na data da importação. Isso não é
perda de dado (o dado nunca existiu), mas precisa estar claro antes de alguém
pedir um relatório de "clientes novos por mês" incluindo o passado.

**Imagens em base64 dentro do `.ft`.** Um orçamento com vários layouts
ilustrados pode ter alguns MB. Guardar o `.ft` inteiro como JSONB no Postgres
funciona, mas engorda a linha e deixa qualquer consulta lenta. O caminho limpo é
extrair as imagens para armazenamento de objetos na importação e deixar
referência no JSON — **sem alterar o `.ft` original no Drive**, que continua
auto-contido conforme o contrato.

**A tabela `orcamentos` do SQLite está em disco efêmero.** O que estiver lá já
pode ter sido perdido em algum deploy. Antes de planejar a migração dela,
confirme se ainda é usada — provavelmente os `.ft` no Drive já são a fonte real.

**Cota da service account.** A conta de serviço do Google **não pode criar**
arquivos (não tem cota própria), só editar os que já existem — daí o fallback
por Apps Script no `server.py`. Qualquer processo de importação que precise
escrever no Drive esbarra nisso. Ler e buscar funcionam normalmente.

**Autenticação muda de natureza.** Hoje: um token compartilhado e um token de
admin. No CRM: usuário por setor, com permissão. Nenhum registro histórico tem
autor, então as permissões passam a valer só daqui para frente.

### Roteiro sugerido

1. Extrair um retrato do `fourtime-banco.json` e dos `.ft` — só leitura, sem
   tocar em nada.
2. Rodar um importador **em modo relatório**: quantos itens por categoria,
   quantas colisões de chave, quantas lápides, tamanho dos `.ft`, quantos com
   imagem grande. Nada é gravado.
3. Henrique revisa o relatório de ambiguidades e decide os casos duvidosos.
4. Importar com os UUIDs cunhados, lápides como `deleted_at`, imagens extraídas.
5. Ligar o `/api/db` do `server.py` como projeção do Postgres. O editor não muda.
6. Golden files rodando no CI dos dois lados.

O passo 2 é o que transforma isso de aposta em trabalho de engenharia. Ele é
barato e responde, com número, todas as perguntas acima.
