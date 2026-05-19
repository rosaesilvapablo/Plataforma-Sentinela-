# Arquitetura — Plataforma Sentinela 2026

## Camadas

```
src/
  domain/        # Tipos puros, schemas Zod, modelos de negocio, modules.ts
  data/          # Acesso a Firestore/Storage (repositorios), nada de UI
  services/      # Orquestracao de regras (ex.: calculo de Art. 316)
  hooks/         # React hooks que conectam UI a data/services
  components/    # UI generica (design system)
  features/      # Telas/fluxos por modulo (Equipe, Ausencias, PPL...)
  routes/        # Configuracao de rotas e guards
  lib/           # Integracoes (firebase, datas, formatadores)
  test/          # Setup de testes, fakes, utilitarios
```

## Princípios

- **Separacao de camadas**: UI nao chama Firestore direto; usa hooks que usam
  repositorios. Trocar de backend deve ser tarefa de uma camada, nao do app inteiro.
- **Tipos sao a verdade**: schemas Zod em `domain/` geram tipos TS E validam payloads.
  Cloud Functions usam os mesmos schemas (compartilhados).
- **Sem mocks na producao**: testes usam emuladores Firebase, nao mocks frageis.
- **Sem dist no Git**: hosting builda no CI (futuramente) ou localmente.
- **Sem secrets no Git**: tudo via `.env.local` (ignorado) e Secret Manager do Firebase.

## Camada de seguranca (defesa em profundidade)

1. **Auth**: Firebase Auth com custom claim `role`.
2. **App Check**: bloqueia clientes nao verificados.
3. **Firestore rules**: deny-all + bloco explicito por colecao + `hasOnly` no schema.
4. **Cloud Functions**: revalidam role + payload mesmo apos rules.
5. **CSP + HSTS + frame-ancestors none** no hosting.

## Fluxo de um modulo (template)

Para cada novo modulo:

1. `domain/modules/<modulo>.ts`: schema Zod, tipos, enums.
2. `firestore.rules`: bloco especifico + validacao usando `hasOnly`.
3. `data/<modulo>.repo.ts`: CRUD encapsulado.
4. `hooks/use<Modulo>.ts`: integra repo com React.
5. `features/<modulo>/`: telas (list, form, detail).
6. Testes: unitarios para dominio/regras de negocio + smoke E2E no emulador.
7. Atualizar `MATRIZ_MODULOS_CONTRATO.md` marcando o modulo como entregue.
