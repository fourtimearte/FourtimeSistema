# Deploy no Render — passo a passo (Fase 1, frontend)

> Nesta fase sobe só o **frontend** como **Static Site** (site estático). Ele fica no ar e
> navegável, mas com **dados fictícios** (sem persistência) — o banco (Supabase) entra na Fase 3.
> O repositório já traz um `render.yaml` (Blueprint), então há dois caminhos: o automático
> (Blueprint) e o manual. Use o que preferir.

---

## Pré-requisito
O código precisa estar no GitHub (o repositório `FourtimeSistema`). Isso eu já subo por você.

---

## Caminho A — Blueprint (automático, recomendado)

O `render.yaml` na raiz já descreve tudo. O Render lê ele sozinho.

1. Acesse **https://dashboard.render.com** e faça login (pode entrar com o GitHub).
2. Clique em **New +** → **Blueprint**.
3. Em **Connect a repository**, autorize o Render a acessar sua conta do GitHub e escolha o repositório **`FourtimeSistema`**.
4. O Render detecta o `render.yaml` e mostra o serviço **fourtime-sistema** (tipo *Static Site*). Clique em **Apply**.
5. Aguarde o build (~1–2 min). Quando terminar, o site fica em algo como `https://fourtime-sistema.onrender.com`.

Pronto. A cada `git push` na branch principal, o Render **rebuilda e republica sozinho**.

---

## Caminho B — Manual (sem Blueprint)

Se preferir configurar na mão:

1. **New +** → **Static Site**.
2. Conecte e escolha o repositório **`FourtimeSistema`**.
3. Preencha os campos exatamente assim:
   - **Name:** `FourtimeSistema`
   - **Branch:** `main`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
4. Em **Redirects/Rewrites** (aba Settings depois de criar), adicione uma regra:
   - **Source:** `/*` · **Destination:** `/index.html` · **Action:** `Rewrite`
   (isso evita erro 404 ao dar refresh dentro do app.)
5. Clique em **Create Static Site**. Ao terminar o build, o site está no ar.

---

## Notas importantes

- **Plano free do Render:** static site no free tier é servido por CDN e **não hiberna** (diferente de web service). Ou seja, o app abre rápido sempre.
- **Custo:** static site é gratuito no Render.
- **Fonte dos dados:** enquanto não houver Supabase, tudo é mock em memória — ótimo para você e a equipe testarem o fluxo e o visual no ar, em qualquer celular/computador, sem instalar nada.
- **Quando o Supabase entrar (Fase 3):** as chaves públicas (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) vão em **Environment** no painel do Render (já deixei comentado no `render.yaml`). O banco em si roda no Supabase, não no Render.
- **O editor v172 continua onde está** (no `fourtime-etapa02.onrender.com`); ele será embutido depois, não é afetado por este deploy.

---

## Resumo dos valores (cola rápida)

| Campo | Valor |
|---|---|
| Tipo | Static Site |
| Root Directory | `frontend` |
| Build Command | `npm install && npm run build` |
| Publish Directory | `dist` |
| Rewrite | `/*` → `/index.html` |
| Branch | `main` |
