# Fourtime CRM V6 — fundação

App novo, ao lado do `frontend/` antigo. O antigo continua no ar e intacto
até o V6 alcançar paridade; nada de CSS dele atravessa (decisão 04/08/2026).

```bash
npm install
npm run dev      # http://localhost:5173 — abra /kit
npm run build
```

## Onde as coisas moram

```
src/
├─ index.css              gerado pelo shadcn a partir do preset b7AJGDOVg8 (base-luma)
│                         + 1 correção: --sidebar-primary do tema escuro
├─ styles/tokens-v6.css   o que o preset não traz: paleta categórica --cat-1..8,
│                         cores de estado, WhatsApp e a camada de densidade
├─ lib/prefs.tsx          densidade (localStorage + data-density no <html>)
├─ lib/modulos.ts         registro único de módulo → rota, ícone, grupo, cor
├─ components/layout/     Shell (rail + topbar)
└─ routes/kit/            a rota /kit
```

## Configuração aplicada

`components.json` → `"style": "base-luma"`, baseColor neutral, iconLibrary lucide,
menuColor default, menuAccent subtle. Confira com:

```bash
npx shadcn@latest preset decode b7AJGDOVg8
```

## As regras que valem aqui

1. Nenhuma cor literal fora de `index.css` e `tokens-v6.css`.
2. Densidade muda espaçamento e altura — nunca raio, cor ou tipografia.
3. `/kit` renderiza os componentes **reais**. Componente novo só está pronto
   quando tem sua seção lá.
4. Nada de visual do `frontend/` antigo atravessa. Só lógica, como função pura.

Detalhes em `.claude/skills/fourtime-crm-v6/`.
