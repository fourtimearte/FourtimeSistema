# Relatório do banco — passo 0 da migração para o V6

Script de **leitura** que levanta, com número, tudo o que precisa ser decidido
antes de migrar o cadastro e os orçamentos para o Postgres do CRM V6.

**Ele não escreve nada.** Só faz requisições GET ao servidor e grava os
arquivos de saída na pasta local que você indicar. Nada muda no Drive, no
servidor, no editor ou no banco.

## Como rodar

```bash
python3 ferramentas/relatorio-banco/relatorio_banco.py \
  --url https://fourtime-etapa02.onrender.com \
  --token "$FT_TOKEN" \
  -o ./saida-relatorio
```

Amostra maior de `.ft` (padrão são 40; `0` abre todos):

```bash
python3 ferramentas/relatorio-banco/relatorio_banco.py \
  --url https://fourtime-etapa02.onrender.com --token "$FT_TOKEN" --amostra 200
```

Se preferir rodar sobre arquivos já baixados:

```bash
python3 ferramentas/relatorio-banco/relatorio_banco.py \
  --banco ./fourtime-banco.json --pasta-ft ./orcamentos
```

Só precisa de Python 3.8+. Sem dependências externas.

## O que sai

| Arquivo | Para quê |
|---|---|
| `relatorio.md` | leitura humana — é o que você lê |
| `ambiguidades.csv` | os casos que precisam da decisão do Henrique (abre no Excel) |
| `relatorio.json` | os mesmos dados, para o importador consumir depois |

## O que ele responde

1. Quantos itens por categoria existem no `fourtime-banco.json`.
2. **Quantas colisões de chave existem** — o problema central da migração. A
   chave de mesclagem do servidor hoje é o *nome em maiúsculas*
   (`_chave()` em `server.py`), então renomear cria registro novo, homônimos já
   estão fundidos, e acento distingue ("JOÃO" ≠ "JOAO").
3. Quantas lápides (`_removidos`) precisam virar `deleted_at`. Se forem
   descartadas e o editor sincronizar depois, os itens **ressuscitam** — é o bug
   que a mesclagem com lápides existe para evitar.
4. Que campos cada categoria realmente usa, com cobertura — o esboço do schema
   Postgres sai daqui.
5. Quantos `.ft` existem, como estão distribuídos e quanto pesam.
6. Numa amostra de `.ft` aberta de verdade: versões do formato, quantas imagens
   em base64 e quanto pesam, e **quais tags HTML aparecem** em `obs` e
   `anotacoes` — essa lista é o que a sanitização precisa permitir e o que o
   contêiner de prosa do V6 precisa estilizar, já que o CSS antigo não vai junto.

## Depois de rodar

1. Revisar `ambiguidades.csv` e decidir os casos de risco alto.
2. O importador cunha um UUID por item e nunca mais chaveia por nome.
3. Lápides entram como `deleted_at`.
4. Imagens base64 saem para armazenamento de objetos — **sem alterar o `.ft`
   original no Drive**, que continua auto-contido pelo contrato `FT-FORMATO`.
5. O `/api/db` do `server.py` vira projeção do Postgres. O editor não muda.
