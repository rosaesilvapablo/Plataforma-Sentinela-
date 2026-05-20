# Matriz de Módulos — Plataforma Sentinela 2026

Arquitetura definitiva, validada com o usuário em 2026-05-19. Fonte executável
correspondente em `src/domain/modules.ts` (a ser construída módulo a módulo).

## Perfis e Modelo de Acesso

Perfis: `admin`, `diretor`, `juiz`, `supervisor`, `servidor`, `estagiario`, `terceirizado`.

**Decisão chave: `admin` e `diretor` são funcionalmente idênticos** para todos os
efeitos de permissão — CRUD total em absolutamente tudo. Mantidos como dois
labels distintos para significar posições organizacionais diferentes (admin =
super-admin técnico; diretor = autoridade institucional). Helper no código:
`hasFullAccess(role)` retorna `true` para qualquer um dos dois.

Demais perfis têm acesso escalonado conforme cada módulo abaixo.

## Navegação (ordem do sidebar)

| # | Módulo | Rota |
|---|---|---|
| 1 | Sala de Situação (Dashboard) | `/` |
| 2 | Mesa de Trabalho (Kanban) | `/mesa` |
| 3 | Calendário | `/calendario` |
| 4 | PPL Criminal | `/ppl` |
| 5 | Expedientes | `/expedientes` |
| 6 | SISBAJUD & Depósitos | `/sisbajud` |
| 7 | Recolhimentos & Gestão | `/recolhimentos` |
| 8 | Estatísticas | `/estatisticas` |
| 9 | Metas CNJ | `/metas` |
| 10 | Equipe | `/equipe` |
| 11 | Admin | `/admin` |

---

## 1. Sala de Situação (Dashboard)

- **Coleção própria**: nenhuma. Agrega via `onSnapshot` em todas as coleções relevantes.
- **Leitura**: todos os autenticados (visão filtrada por perfil)
- **Widgets**: **fixos** (sem personalização por usuário)
- **Refinamentos**:
  - Alertas acionáveis: Art. 316 vencendo, expedientes atrasados, plantão sem responsável, metas CNJ críticas, ausências pendentes
  - Botão atalho **"Lançar ausência rápida"**
  - Reativo via `onSnapshot` — sem F5, sem polling

## 2. Mesa de Trabalho

- **Formato**: Kanban com colunas = estados processuais
- **Coleção**: `mesa_cards`
- **Estados (colunas)**: `concluso_despacho` · `concluso_decisao` · `concluso_sentenca` · `em_diligencia` · `concluido`
- **Leitura**: diretor / admin / juiz / supervisor / servidor
- **Escrita**: diretor / admin / supervisor / servidor (estagiário e terceirizado não escrevem)
- **Refinamentos**:
  - SLA por proximidade de prazo (cor)
  - Atribuição puxa cadastro do módulo Equipe
  - Máquina de estados com transições validadas (não dropdown solto)

## 3. Calendário

- **Coleção própria**: `calendar_events` (apenas eventos manuais: feriados, sessões institucionais)
- **Eventos derivados** (em runtime, sem persistir): plantões, ausências/frequência, prazos de expedientes, revisões Art. 316
- **View**: **mês** apenas
- **Leitura E escrita**: **apenas admin / diretor** (visão executiva)
- **Integração externa** (Google / iCal): futuro
- **Refinamentos**:
  - Camada de agregação consulta as coleções fonte ao montar o mês
  - Otimização futura: cache local (IndexedDB) se performance exigir

## 4. PPL Criminal

Subabas:

### 4a. Pessoas Privadas de Liberdade
- **Coleção**: `ppl`
- **Tipos de prisão**: `preventiva` · `temporaria` · `flagrante` · `definitiva` · `monitoramento_eletronico` · `outra`
- **Leitura**: diretor / admin / juiz / supervisor / servidor
- **Escrita**: diretor / admin
- **Refinamento crítico**: cálculo automático da próxima revisão Art. 316 (90 dias) ao registrar prisão preventiva; alertas em 3 níveis (30d amarelo / 7d vermelho / vencido crítico)

### 4b. Mandados & Difusão Vermelha
- **Coleção**: `mandados`
- **Categorias** (campo `categoria`): `pendente_cumprimento` · `difusao_vermelha` · `revisao_316`
- **Leitura**: diretor / admin / juiz / supervisor / servidor
- **Escrita**: diretor / admin
- **Refinamento**: preparado para integração futura com BNMP

### 4c. Testemunhas Protegidas (Lei 9.807/99)
- **Coleção**: `protected_witnesses`
- **Leitura**: apenas diretor / admin / juiz
- **Escrita**: apenas diretor / admin
- **Refinamento**: campos sensíveis com regras Firestore restritas (sem expansão para supervisor/servidor)

## 5. Expedientes

- **Coleção**: `expedientes`
- **Tipos**: `oficio` · `carta_precatoria` · `mandado_diligencia`
- **Estados (máquina explícita)**: `pendente` → `emitido` → `cumprido` | `em_diligencia` | `cancelado`
- **Leitura**: diretor / admin / juiz / supervisor / servidor
- **Escrita**: diretor / admin / supervisor / servidor
- **Refinamentos**:
  - Prazo default por tipo (configurável via Admin)
  - Transições inválidas bloqueadas na UI E nas regras
  - Relatório de pendências por responsável

## 6. SISBAJUD & Depósitos

- **Coleções**: `sisbajud_ordens` (1:N) `depositos_sisbajud`
- **Estados ordem**: `pendente` · `bloqueado` · `transferido` · `cancelado`
- **Leitura**: diretor / admin / juiz / supervisor / servidor
- **Escrita**: diretor / admin
- **Refinamentos**:
  - Conciliação visual: valor bloqueado × valor transferido × saldo em conta
  - Timeline do desdobramento de cada ordem
  - Cada ordem pode gerar N depósitos vinculados

## 7. Recolhimentos & Gestão

Subabas:

### 7a. Orientações
- **Coleção**: `recolhimentos_orientacoes` (documento único)
- **Formato**: **rich text editável**
- **Leitura**: todos os autenticados
- **Escrita**: apenas admin / diretor
- **Refinamento**: editor rich text (texto orientativo sobre como recolher prestações pecuniárias, multas, fiança etc.)

### 7b. Gestão de Contas
- **Coleção**: `contas_geridas`
- **Contas**: `ANPP` · `PRD` · `Conta_Unica`
- **Leitura**: diretor / admin / juiz
- **Escrita**: diretor / admin
- **Refinamentos**: extrato cronológico + destinação rastreável; saldo calculado por movimentação

## 8. Estatísticas

- **Coleção**: `boletins_estatisticos`
- **Tipos**: `tipo_1` (acervo) · `tipo_4` (gerencial)
- **Periodicidade**: mensal
- **Entrada**: **importação CSV** (parser + validação)
- **Leitura**: diretor / admin / juiz
- **Escrita**: diretor / admin
- **Refinamentos**:
  - Validação cruzada com mês anterior (sinaliza queda/pico não justificado)
  - Exportação CSV/PDF padronizada para envio ao tribunal

## 9. Metas CNJ

- **Coleção**: `metas_cnj_evolucao`
- **Periodicidade**: mensal
- **Leitura**: diretor / admin / juiz
- **Escrita**: diretor / admin
- **Refinamentos**: tabela mensal + curva de tendência + projeção "se mantiver ritmo, cumpre/não cumpre" com GAP calculado

## 10. Equipe

Modelo de pessoa unificado em `team`. Uma pessoa = uma entidade com:
- `cargoEfetivo` — **imutável** após criação
- `funcaoComissionada` — mutável, **sem histórico**
- `tipoVinculo`: `juiz` · `servidor` · `estagiario` · `terceirizado` · `cedido` · `requisitado` · `voluntario`

Sem rotinas de "renovação de equipe" — cadastro evolui organicamente.

Subabas:

### 10a. Quadro Geral
- Visualização: lotação paradigma × lotação real; comissionados, cedidos, estagiários etc.
- **Leitura**: todos os autenticados
- **Escrita**: diretor / admin

### 10b. Cadastro
- **Coleção**: `team`
- **Leitura**: todos os autenticados
- **Escrita**: diretor / admin

### 10c. Frequência (ausências + faltas)
- **Coleção**: `frequencias` — **docId autogerado** (corrige bug do legado de `userId`-como-`docId` que sobrescrevia histórico)
- **Tipos**: `ausencia_justificada` · `falta_injustificada`
- **Leitura**: próprio dono + diretor / admin
- **Escrita**: próprio dono (criar pedido) + diretor / admin (aprovar / consolidar)
- **Refinamento**: botão atalho no Dashboard

### 10d. Plantão
- **Coleção**: `plantoes`
- **Modelo**: período + juiz responsável + servidor responsável + tipo (`ordinario` · `extraordinario` · `recesso`)
- **Leitura**: todos os autenticados
- **Escrita**: diretor / admin

### 10e. Regime de Trabalho
- **Coleção**: `regime_trabalho`
- **Tipos**: `presencial` · `hibrido` · `integral_remoto`
- **Vinculo**: número de processo SEI obrigatório
- **Leitura**: próprio + diretor / admin
- **Escrita**: diretor / admin
- **Refinamento**: alerta de prazo de revisão do regime

## 11. Admin

Subabas:

### 11a. Usuários
- **Coleção**: `access_list`
- **Operações** (via Cloud Functions): criar, atribuir/trocar role, desativar
- **Guards**: anti auto-lockout (admin não rebaixa nem desativa a si mesmo)

### 11b. Configurações
- **Coleção**: `system_config`
- Parâmetros: prazos default por tipo de expediente, parâmetros do Art. 316, textos do sistema

### 11c. Logs / Auditoria
- **Coleção**: `audit_logs`
- Escrita **apenas via Cloud Function trigger** (cliente não escreve)
- Operações auditadas: criação/desativação de usuário, troca de role, mudanças em Testemunhas Protegidas, alterações financeiras críticas

### 11d. Exportações / Backups
- Reservado para futuro (export Firestore + Storage)

**Acesso a TODO o módulo Admin**: apenas admin / diretor.

---

## Resumo de Coleções Firestore

| Coleção | Módulo | Escrita |
|---|---|---|
| `mesa_cards` | Mesa de Trabalho | diretor / admin / supervisor / servidor |
| `calendar_events` | Calendário | admin / diretor |
| `ppl` | PPL Criminal | admin / diretor |
| `mandados` | PPL Criminal | admin / diretor |
| `protected_witnesses` | PPL Criminal | admin / diretor |
| `expedientes` | Expedientes | admin / diretor / supervisor / servidor |
| `sisbajud_ordens` | SISBAJUD & Depósitos | admin / diretor |
| `depositos_sisbajud` | SISBAJUD & Depósitos | admin / diretor |
| `recolhimentos_orientacoes` | Recolhimentos | admin / diretor |
| `contas_geridas` | Recolhimentos | admin / diretor |
| `boletins_estatisticos` | Estatísticas | admin / diretor |
| `metas_cnj_evolucao` | Metas CNJ | admin / diretor |
| `team` | Equipe | admin / diretor |
| `frequencias` | Equipe | próprio dono / admin / diretor |
| `plantoes` | Equipe | admin / diretor |
| `regime_trabalho` | Equipe | admin / diretor |
| `access_list` | Admin | Cloud Function (escrita server-side) |
| `system_config` | Admin | admin / diretor |
| `audit_logs` | Admin | Cloud Function trigger (cliente não escreve) |

## Lições do Legado a NÃO Repetir

- Módulos "ocultos" no nav que não funcionam — se está no menu, está pronto.
- Aliases (`team` / `membros` / `paradigmas`) escondem inconsistência — **um modelo canônico** por entidade.
- `docId` reutilizando chave de negócio (caso `ausencias` no legado) — sempre autogerado, com FK explícita.
- Validação Firestore desalinhada com o schema do app — Zod + rules na mesma fonte (allowlist compartilhado).
- Regras com OR-union genérico — **proibido**. Deny-all + bloco explícito por coleção.
- Build / lint / test desativados como "fix" — endereçar bugs de raiz, não mascarar.
