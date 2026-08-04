# Fourtime · Sistema (React) — Fase 1

Base de produção do sistema CRM + ERP + Produção da Fourtime, na stack oficial.
Este é o **scaffold da Fase 1**: fundação React + a ponte de tokens do Design System v5,
o shell (topbar + rail escuros), o store com o **motor de roteamento** e as páginas de
prova **Dashboard** e **Kanban** funcionando. As demais páginas são stubs (Fase 2).

O protótipo single-file `fourtime-sistema-v1.html` continua sendo a referência viva do fluxo
e do visual — este projeto porta aquilo para a stack que vai para produção.

## Stack
React 18 + TypeScript + Vite · Tailwind (via `tailwind.preset` que espelha os tokens) ·
Zustand (estado + roteamento) · @dnd-kit (Kanban) · lucide-react (ícones) · Framer Motion.

## Rodar
```bash
cd frontend
npm install
npm run dev      # http://localhost:5173
npm run build    # gera dist/ (verificado: build limpo)
npm run preview  # serve o dist/
```

## Estrutura
```
frontend/
├─ src/
│  ├─ styles/tokens.css        ← FONTE ÚNICA DA VERDADE (copiada do design kit v5)
│  ├─ theme/tailwind.preset.ts ← espelha os tokens: bg-set-dtf === var(--set-dtf)
│  ├─ store/model.ts           ← tipos + dados mock + helpers de negócio
│  ├─ store/useApp.ts          ← Zustand: estado + MOTOR DE ROTEAMENTO (aprovar → Kanban)
│  ├─ components/  Shell, Login, Toasts, ui
│  └─ pages/       Dashboard, Kanban (funcionais) · Stub (demais, Fase 2)
```

## O motor central (igual ao protótipo)
Aprovar um pedido lê `layout.design[]` (as tags de técnica) e gera um card por técnica na
faixa correta do Kanban — `store/useApp.ts → roteia()`. Uma técnica = uma cor, do editor ao card.

## Regras herdadas (não quebrar)
- `tokens.css` é a fonte única — só acrescentar, nunca renomear.
- O `.ft` é contrato inviolável — o editor v172 continua dono do formato (Fase 4, via iframe + postMessage).
- Cores por setor e tipografia (Plex Sans/Mono, Roboto no A4) vêm do kit v5.

## Próximas fases
Ver `PLANO-MIGRACAO-REACT.md`: Fase 2 (páginas restantes) · Fase 3 (backend FastAPI + Postgres) ·
Fase 4 (editor v172 embutido + .ft) · Fase 5 (deploy/produção).
