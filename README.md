# Plataforma Sentinela 2026

Reconstrucao do zero da Plataforma Sentinela — Monitoramento Judicial.

A versao anterior esta congelada em manutencao em `C:\Users\pablo\Desktop\plataforma sentinela` e
permanece operacional ate o cutover. Esta reconstrucao segue modulo a modulo, validando paridade
funcional contra o contrato (`docs/CONTRATO_DIRETRIZES_ESCOPO.md`) e a matriz
(`docs/MATRIZ_MODULOS_CONTRATO.md`), com refinamentos planejados.

## Stack

- Vite 8 + React 19 + TypeScript 5.9 (strict, com `noUncheckedIndexedAccess` e `exactOptionalPropertyTypes`)
- Tailwind CSS 4 (CSS-first com `@theme`, via `@tailwindcss/vite`)
- Firebase 12: Auth, Firestore, Cloud Functions, Storage, Hosting, App Check
- React Router 7
- Vitest 4 + Testing Library + jsdom 29
- ESLint 9 (flat config) + Prettier
- Zod 4 (validação de schema)
- Lucide React 1 (ícones)

Nota: ESLint mantido em 9.x e TypeScript em 5.9.x porque o `typescript-eslint` 8.x
(ultimo estavel) ainda nao suporta oficialmente ESLint 10 / TypeScript 6. Bumpamos
quando o ecossistema acompanhar.

## Comandos

```bash
npm install
npm run dev          # dev server em http://127.0.0.1:5173
npm run build        # type-check + build de producao
npm run preview      # serve o dist
npm run lint
npm run format
npm run typecheck
npm run test         # vitest run
npm run test:watch
```

## Lições aprendidas (NAO repetir)

- Nao commitar `dist/` — `.gitignore` ja cobre.
- Nao commitar `.env`, `serviceAccountKey*.json`, `users.json` ou scripts locais de elevacao.
- Nao desativar `build` / `lint` / `test` — quando algo der errado, corrigir, nao mascarar.
- Regras Firestore: NUNCA escrever `match /{collection}/{docId}` cobrindo as mesmas colecoes
  ja tratadas em blocos especificos (causa uniao OR que vaza acesso e anula validacoes).
- Schema das regras precisa bater com o schema que o frontend grava — validar com testes.

## Status

- [x] Bootstrap (configs, tooling, estrutura, deny-all rules)
- [ ] Auth + layout + design system + Firebase wiring
- [ ] Modulo Equipe (primeiro CRUD)
- [ ] Modulo Ausencias
- [ ] Calendario Institucional
- [ ] Plantao Judicial
- [ ] Expedientes
- [ ] PPL e Medidas Cautelares
- [ ] SISBAJUD
- [ ] Depositos e Recolhimentos
- [ ] Estatisticas, Metas e Dashboards

## Setup do Firebase (acao manual)

1. Criar novo projeto no [console do Firebase](https://console.firebase.google.com/).
2. Habilitar: Authentication (Email/Password), Firestore (modo producao), Storage, Functions.
3. Copiar `.firebaserc.example` para `.firebaserc` e preencher com o `project_id`.
4. Copiar `.env.example` para `.env.local` e preencher com a config Web do projeto.
5. Habilitar App Check (reCAPTCHA Enterprise) e colar a site key em `VITE_FIREBASE_APPCHECK_SITE_KEY`.
6. Considerar dominio proprio desde o inicio para evitar flag de Safe Browsing do `*.web.app`.
