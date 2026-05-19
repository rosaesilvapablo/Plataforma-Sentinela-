# Segurança — Baseline da Plataforma Sentinela 2026

## Segredos

- `.env`, `.env.local`, `serviceAccountKey*.json`, `users.json`, scripts locais de
  elevação administrativa **NUNCA** são versionados. `.gitignore` já cobre.
- Chaves do Firebase Web (`VITE_FIREBASE_*`) são publicas por design — restringir
  por dominio e API no console GCP.
- Service accounts locais (para scripts pontuais) saem do repositorio assim que
  usados. Em producao, Cloud Functions usam credenciais do ambiente (ADC).

## Firestore Rules

- **Sempre deny-all como ultimo bloco**.
- Admin tem CRUD total via `match /{document=**}` no inicio (regra mestra).
- Cada colecao tem bloco proprio com `allow read/create/update/delete` explicitos.
- **NUNCA escrever um `match /{collection}/{docId}` generico que cubra colecoes
  ja tratadas em blocos especificos** — a logica OR do Firestore amplia o acesso
  e anula validacoes. Esse foi o bug critico do projeto anterior.
- Validacoes de schema (`hasOnly` + `is string`/`is number` + enums) devem bater
  com o schema Zod do dominio. Mudancas de schema atualizam regras E testes na
  mesma PR.

## Cloud Functions

- Revalidam role e payload mesmo apos rules (defesa em profundidade).
- Operacoes administrativas registram `createdBy`/`updatedBy`/`disabledBy` + timestamp.
- Senhas temporarias usam `crypto.randomInt` (CSPRNG), nunca `Math.random`.
- Admin nao pode rebaixar/desativar a propria conta (anti auto-lockout).
- Provisionamento com compensacao: se falhar apos `auth.createUser`, executar
  `auth.deleteUser` para nao deixar contas orfas.

## App Check

- Ativar reCAPTCHA Enterprise (ou v3) no console Firebase.
- Site key vai em `VITE_FIREBASE_APPCHECK_SITE_KEY`.
- Inicializar no app antes de qualquer chamada Firestore/Functions.

## Hosting / HTTP

- Headers no `firebase.json`: CSP, HSTS, X-Frame-Options DENY, Referrer-Policy,
  Permissions-Policy, X-Content-Type-Options.
- `frame-ancestors 'none'` impede embedding (anti-clickjacking).
- Dominio proprio fortemente recomendado — reduz risco de flag do Safe Browsing
  observado em `*.web.app`/`*.firebaseapp.com` por heuristica anti-phishing.

## Storage

- Deny-all + blocos por pasta com `contentType` allowlist e tamanho maximo.
- Pastas `team/{uid}` privadas (so o dono + admin).
- Documentos sensiveis nao ficam em `public/`.
