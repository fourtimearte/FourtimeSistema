# Subir ao GitHub — repositório `FourtimeSistema`

> **Situação:** o código da Fase 1 está pronto e commitado. A conexão do GitHub desta
> sessão do Claude está limitada a um conjunto fixo de repositórios que **ainda não inclui
> o `FourtimeSistema`** — por isso eu não consigo dar `push` direto daqui *neste momento*.
> Abaixo, os dois caminhos: liberar o push automático (recomendado) e o push manual agora.

---

## Caminho 1 — Liberar o push automático do Claude (recomendado, ~1 min)

Assim eu passo a subir **toda versão** sozinho, como você pediu.

1. Vá em **GitHub → Settings** (do seu perfil `fourtimearte`).
2. Menu **Integrations → Applications** → aba **Installed GitHub Apps**.
3. Abra a app do **Claude / Anthropic** (a conexão que você usou para ligar o GitHub aqui).
4. Em **Repository access**, escolha uma das opções:
   - **All repositories** (mais simples — vale para os próximos repos também), ou
   - **Only select repositories** e **adicione `FourtimeSistema`** à lista.
5. Salve (**Save**).
6. Volte aqui e me diga "liberado" — se a conexão for fixada por sessão, pode ser preciso
   iniciar uma **nova tarefa/sessão** do Cowork para ela reconhecer o novo repositório.

Depois disso, é só eu commitar cada versão direto no `FourtimeSistema`.

---

## Caminho 2 — Push manual agora (30 segundos, do seu computador)

Se quiser já ver o código no GitHub sem esperar, baixe o `.zip` que enviei, descompacte,
abra o terminal **dentro da pasta `fourtime-app`** e rode:

```bash
git init
git add .
git commit -m "Fase 1: scaffold React (shell, tokens v5, Dashboard, Kanban) + deploy Render"
git branch -M main
git remote add origin https://github.com/fourtimearte/FourtimeSistema.git
git push -u origin main
```

Na hora do `push`, o GitHub pede login (abre o navegador ou usa seu token). Pronto — o
repositório fica com tudo, incluindo o `render.yaml` para o deploy.

> Se o `git push` reclamar que o repo não está vazio (caso você tenha criado com README),
> rode antes: `git pull origin main --allow-unrelated-histories` e depois o `push`.

---

## Depois de subir: conectar o Render
Siga o **DEPLOY-RENDER.md** (Caminho A — Blueprint). Em resumo: Render → New + → Blueprint
→ escolher `FourtimeSistema` → Apply. O `render.yaml` já está no repo.
