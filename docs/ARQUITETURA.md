# Arquitetura — Plataforma Sentinela 2026

## Camadas

```
src/
  domain/        # Tipos puros, schemas Zod, modules.ts, máquinas de estado
  data/          # Repositórios Firestore/Storage (UI nunca chama Firestore direto)
  services/      # Orquestração de regras de negócio (ex.: cálculo Art. 316)
  hooks/         # Hooks React que conectam UI ↔ data/services
  components/    # Design system (Button, Input, Modal, etc.)
  features/      # Telas/fluxos por módulo (Equipe, PPL, etc.)
  routes/        # Configuração de rotas e guards de role
  lib/           # Integrações (firebase, datas, utils)
  test/          # Setup de testes, fakes, utilitários
```

## Modelo de Perfis

- `admin` e `diretor`: **CRUD total em TUDO** — funcionalmente idênticos. Mantidos
  como dois labels para distinguir posições organizacionais (admin = super-admin
  técnico; diretor = autoridade institucional). No código, helper único:
  ```ts
  hasFullAccess(role) // true para admin OU diretor
  ```
- `juiz`, `supervisor`, `servidor`: leitura/escrita escalonada por módulo
  (ver `MATRIZ_MODULOS_CONTRATO.md`).
- `estagiario`, `terceirizado`: acesso muito restrito; por padrão veem só
  Dashboard (limitado) e seu próprio registro de Frequência.

## Princípios

- **Separação de camadas estrita**: UI nunca chama Firestore direto. Sempre via
  hooks → repositórios. Trocar de backend deve ser tarefa de uma camada.
- **Tipos são a fonte da verdade**: schemas Zod em `domain/` geram tipos TS via
  `z.infer<>` E validam payloads em runtime. Cloud Functions compartilham os
  mesmos schemas. Rules Firestore espelham o allowlist de campos.
- **Sem mocks em produção**: testes usam emuladores Firebase, não mocks frágeis.
- **Sem dist no Git**: hosting builda no CI (futuramente) ou localmente.
- **Sem secrets no Git**: tudo via `.env.local` (ignorado) e Secret Manager.
- **Sem aliases de coleção**: cada entidade tem UMA coleção canônica. Sem
  `membros`/`paradigmas` espelhando `team`.

## Dataflow — Sala de Situação Reativa

```
Repositórios → Firestore
                  ↓ onSnapshot
            Hooks reativos
                  ↓
        Widgets do Dashboard
        (atualizam sem F5, sem polling)
```

Cada módulo grava em sua coleção. A Sala de Situação subscreve via `onSnapshot`
em todas as coleções relevantes e renderiza widgets fixos.

## Calendário como Agregador

- `calendar_events` armazena **apenas** eventos manuais (feriados, sessões
  institucionais lançadas por admin/diretor).
- Demais eventos (plantões, ausências, prazos de expedientes, revisões Art. 316)
  são **derivados em runtime** consultando as coleções de origem.
- Visão de mês recompõe a partir das múltiplas fontes; sem materialização (sem
  duplicar dado).
- Otimização futura: cache local (IndexedDB) se performance exigir.

## Máquinas de Estado (Mesa de Trabalho, Expedientes, SISBAJUD)

- Estados definidos em `domain/` como TS literal unions.
- Transições válidas em uma tabela explícita `fromState × toState → bool`.
- UI nunca expõe transição inválida.
- Repositório / Cloud Function valida a transição **antes** de gravar.

## Auditoria

- Coleção `audit_logs` com operações críticas: criar/desativar usuário, trocar
  role, mudanças em Testemunhas Protegidas, alterações financeiras críticas
  (depósitos, contas geridas).
- **Escrita apenas via Cloud Function trigger** — cliente nunca escreve direto
  (impede falsificação).
- **Leitura apenas admin/diretor**.

## Template de Implementação por Módulo

Para cada novo módulo:

1. `domain/modules/<modulo>.ts` — schema Zod, tipos via `z.infer<>`, enums, estados.
2. `firestore.rules` — bloco específico explícito, sem genéricos. Validação espelhando o schema.
3. `data/<modulo>.repo.ts` — CRUD encapsulado. UI não importa `firebase/firestore` direto.
4. `hooks/use<Modulo>.ts` — integra repositório com React (queries reativas).
5. `services/<modulo>.ts` (se houver regra complexa) — orquestração pura, sem React.
6. `features/<modulo>/` — telas (list, form, detail, subabas).
7. Testes Vitest — domínio (unitário) + regras (emulador) + UI smoke.
8. Atualizar `MATRIZ_MODULOS_CONTRATO.md` marcando entrega.

## Não-Retrocesso e Refinamento Ativo

- Nenhum módulo da matriz pode ser entregue com escopo menor do que o legado.
- Refinamentos acordados nesta reconstrução estão marcados na matriz (ex.:
  docId autogerado em Frequência, Kanban com estados processuais reais em Mesa
  de Trabalho, Calendário como agregador, conciliação SISBAJUD).
