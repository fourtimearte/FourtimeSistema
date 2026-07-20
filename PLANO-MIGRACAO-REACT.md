# Plano de Migração — Sistema Fourtime na stack oficial (React + FastAPI)

> **Decisão (Henrique, 20/07/2026):** o sistema de produção será construído na **stack oficial** — React + TypeScript + Vite + Tailwind + shadcn/ui — com o **editor v172 real embutido como micro-frontend**. O protótipo `fourtime-sistema-v1.html` (single-file) fica como **validador de UX e referência viva** do fluxo e do visual; o React é a base de produção.
>
> **Backend (decisão 20/07/2026): Supabase como backend único.** Postgres gerenciado + Auth (login por setor) + API automática (PostgREST) + Realtime + Storage. Substitui o FastAPI+Postgres do plano original. O `server.py` (FastAPI do editor) permanece só enquanto for necessário para o Drive/`.ft`; com o tempo, essa parte migra para o Supabase (Storage/Edge Functions).
>
> **Deploy & versionamento (decisão 20/07/2026):** todo código vive no **GitHub** (repo `fourtime-sistema`), e **cada versão é commitada/pushada**. O **frontend** publica no **Render** como *Static Site* (auto-deploy a cada push). O **Supabase** é serviço gerenciado à parte (não passa pelo Render).

---

## 1. Princípios que não mudam (herdados)

1. **O pedido é o fio condutor** (`PD####`) — mesma espinha do protótipo.
2. **O `.ft` é o contrato inviolável** — o React lê/escreve o **mesmo** schema `.ft`; nunca um fork. O editor v172 continua sendo o leitor/escritor canônico.
3. **Rota de produção derivada das tags de Design** — o motor de roteamento portado do protótipo (aprovar → lê `layout.design[]` → gera cards nas faixas).
4. **Um token, dois mundos** — `tokens.css` (CSS vars, fonte única) + `tailwind.preset.ts` (espelha os nomes). Editor single-file usa a var; React usa a classe Tailwind. Renderizam igual.
5. **Design System Personifour v5** — cores por setor, tipografia (Plex Sans/Mono, Roboto no A4), 15 animações nomeadas, claro/escuro/densidade.

---

## 2. Estrutura do repositório (monorepo leve)

```
fourtime-app/
├─ frontend/                 # React + Vite + TS
│  ├─ src/
│  │  ├─ styles/tokens.css         # ← fonte única (do design kit v5)
│  │  ├─ styles/index.css          # @tailwind + import tokens
│  │  ├─ theme/tailwind.preset.ts  # espelha os tokens p/ Tailwind
│  │  ├─ store/                    # Zustand (dados + motor de roteamento)
│  │  ├─ lib/ft.ts                 # schema .ft + escada de migração (importada)
│  │  ├─ components/                # Shell, Icons, ui/ (shadcn)
│  │  ├─ pages/                     # Dashboard, Comercial, CRM, Kanban, BOM, Estoque, Financeiro
│  │  ├─ App.tsx  main.tsx
│  ├─ index.html  package.json  vite.config.ts  tailwind.config.ts  tsconfig.json
├─ backend/                  # FastAPI (evolui o server.py atual do editor)
│  ├─ app/main.py  models.py  routers/  db.py
│  └─ requirements.txt
└─ editor/                   # v172 single-file servido como micro-frontend (iframe)
```

O **backend** não nasce do zero: o `server.py` do editor (FastAPI no Render, token, Drive, sync por revisão) é a base — ganha rotas de pedidos, clientes, estoque, produção e um banco Postgres (persistente, resolvendo a limitação do SQLite no free tier).

---

## 3. A ponte de tokens (primeiro artefato, destrava tudo)

- `tokens.css` copia **verbatim** o bloco `:root` do `personifour-design-kit-v5.html` (neutros, vermelho, cores por setor, semânticos, tipografia, espaço, sombras, densidade, tema claro/escuro, acento). É a **fonte única da verdade**.
- `tailwind.preset.ts` referencia essas vars (`colors:{ primary:'var(--primary)', 'set-dtf':'var(--set-dtf)', … }`), `borderRadius`, `boxShadow`, `fontFamily`. Assim `class="bg-set-dtf"` e `style="background:var(--set-dtf)"` são a mesma cor.
- Tema/densidade/acento seguem via atributos no `<html>` (`data-theme`, `data-density`, `data-accent`) — idêntico ao protótipo.

---

## 4. Como o editor v172 entra (micro-frontend)

- O v172 é **single-file HTML** já no ar (Render/PWA). No React ele entra via **`<iframe>`** na página Comercial, apontando para a URL hospedada (ou para o arquivo servido junto).
- Comunicação React ↔ editor via **`postMessage`**: o editor emite o `.ft` (pedido) ao salvar/aprovar; o React recebe, valida com a escada de migração `migraDoc()` e persiste. O React pode mandar o editor abrir um `.ft` (pedir de novo).
- **Nada do contrato `.ft` é reescrito** — o editor continua dono do formato; o React é consumidor. Regra de ouro do `FT-FORMATO-CONTRATO`.
- Golden files: antes de integrar, extrair 3–5 `.ft` reais como fixtures e um teste que o importador do React abre e bate o estado.

---

## 5. Modelo de dados (backend)

Entidades (Postgres), chaveadas por `pedidoId`:
`cliente`, `referencia`, `bom` (versionada), `insumo`, `pedido` (= `.ft` + metadados), `card_producao` (derivado), `financeiro_pedido`, `usuario` (setor/permissões).
O `pedido` guarda o `.ft` como JSONB (o documento) + colunas indexáveis (cliente, status, valor, prazo) para as tabelas e o Kanban.

---

## 6. Fases de entrega

**Fase 1 — Fundação React (esta rodada).** Scaffold Vite+TS+Tailwind, `tokens.css` + preset, Shell (topbar+rail escuros, tema/densidade), store Zustand com o modelo + motor de roteamento portados, **Dashboard e Kanban** funcionando como prova da stack; stubs das demais páginas. Build verificado.

**Fase 2 — Páginas restantes.** Comercial (com iframe do editor), CRM, BOM, Estoque+Separação, Financeiro — portadas do protótipo, com dnd-kit no Kanban, TanStack Table nas grades, Recharts no Dashboard, Framer Motion nas animações nomeadas.

**Fase 3 — Backend real (Supabase).** Criar o schema no Supabase (tabelas + RLS), Auth por setor, e o client no React (`@supabase/supabase-js`). Trocar o store mock por queries ao Supabase (via TanStack Query). Chaves públicas (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) como env no Render.

**Fase 4 — Integração do editor + `.ft`.** Golden files, ponte postMessage, pedido nascendo do v172 real e persistindo no backend.

**Fase 5 — Produção.** Deploy (frontend estático + FastAPI no Render/Postgres), permissões por setor, baixa automática de estoque pela BOM, dashboards de giro/margem/perdas.

**Caminho crítico:** Fase 1 → 3 (backend) em paralelo com 2 → 4 (editor) → 5.

---

## 7. Deploy (muda em relação ao editor)

O editor era um único HTML servido pelo Render. O React tem **build step**: `vite build` gera estáticos (deploy no Render como site estático ou junto do FastAPI que serve o `dist/`). O backend FastAPI + Postgres roda no Render. O editor v172 continua onde está e é embutido por URL. Ou seja: convivência, não substituição — o v172 segue no ar durante toda a migração.

---
*Fonte da verdade visual: `personifour-design-kit-v5.html`. Contrato de dados: `FT-FORMATO-CONTRATO.md`. Referência de páginas: `claude/PESQUISA-PAGINAS-SISTEMA.md`. Protótipo validador: `fourtime-sistema-v1.html`.*
