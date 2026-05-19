# Matriz de Módulos do Contrato

Referência funcional para a reconstrução incremental da Plataforma Sentinela 2026.
A fonte executável correspondente reside em `src/domain/modules.ts` (a ser criado).

| Módulo | Coleção principal | CRUD | Permissões | Telas | Relatórios | Critérios de aceite |
| --- | --- | --- | --- | --- | --- | --- |
| Equipe | `team` | Criar, ler, atualizar, excluir | Leitura diretiva; escrita administrativa | Lista de equipe; cadastro funcional; lotação paradigma x atual | Quadro de pessoal; lotação divergente; funções comissionadas | Preservar cadastro; comparar lotação; manter aliases `team`/`membros`/`paradigmas` |
| Ausências | `ausencias` | Criar, ler, atualizar, excluir | Usuário no próprio registro; diretor consolida e exclui | Calendário de ausências; solicitação; painel diretivo | Mapa mensal; ausências por servidor | **REFINAMENTO**: docId autogerado com campo `userId` (não usar userId como docId — bug do legado). Impedir troca de `userId` em update; integrar calendário |
| Calendário Institucional | `institutional_events` | Criar, ler, atualizar, excluir | Leitura diretor/juiz; escrita diretor | Agenda; calendário integrado; compromissos | Agenda semanal; prazos; conflitos | Integrar equipe, ausências e plantões; sinalizar conflitos |
| Plantão Judicial | `plantoes` | Criar, ler, atualizar, excluir | Leitura diretor/juiz; escrita diretor | Escalas; responsáveis; fluxos | Escala mensal; responsáveis por período | Registrar responsável, período e tipo; consultar por data |
| Expedientes | `expedientes` | Criar, ler, atualizar, excluir | Leitura diretor/supervisor/servidor/juiz; escrita diretor/supervisor/servidor | Fila; emissão; cumprimento | Pendentes; cumprimento por período | Controlar emissão, status e cumprimento |
| PPL e Medidas Cautelares | `ppl` | Criar, ler, atualizar, excluir | Leitura diretor/juiz/supervisor/servidor; escrita diretor | PPL; alertas Art. 316; classificação | Revisões preventivas; situação carcerária | Controlar revisão preventiva; registrar espécie de prisão |
| SISBAJUD | `sisbajud` | Criar, ler, atualizar, excluir | Leitura diretor/juiz/supervisor/servidor; escrita diretor | Ordens; bloqueios; transferências | Ordens pendentes; valores; transferências | Controlar ordens e preservar alias `sisbajud_orders` |
| Depósitos e Recolhimentos | `deposits` | Criar, ler, atualizar, excluir | Leitura diretor/juiz; escrita diretor | Depósitos; saldos; alocações | Saldo por conta; depósitos; recolhimentos | Diferenciar ANPP, PRD, Conta Única e depósitos judiciais |
| Estatísticas, Metas e Dashboards | `statistics` | Criar, ler, atualizar, excluir | Leitura diretor/juiz; escrita diretor | Indicadores; metas; Tram/Traj; fluxo | Indicadores visuais; metas; balanço; acervo | Redesenhar métricas; preservar dashboards; comparar entradas e saídas |

## Perfis (Roles)

`admin`, `juiz`, `diretor`, `supervisor`, `servidor`, `estagiario`, `terceirizado`.

**Admin tem CRUD total em qualquer módulo** (regra mestra).

## Redesenho Obrigatório

Calendário e Estatísticas não são portados — exigem aprimoramento ativo de usabilidade, precisão de dados e capacidade de monitoramento.

## Refinamentos Acordados nesta Reconstrução

1. **Ausências**: docId autogerado (não mais `userId` como docId — corrige perda de histórico do legado).
2. **PPL/SISBAJUD**: leitura ampliada para supervisor/servidor (além de diretor/juiz).
3. **Segurança**: App Check ativo desde o início, CSP no hosting, sem secrets versionados.
4. **Domínio próprio**: priorizar para evitar flag de Safe Browsing do `*.web.app`.

## Regra de Não-Retrocesso

Nenhum módulo acima pode ser removido, reduzido ou substituído por fluxo menos eficiente. Quando um CRUD ainda depender de dados legados não recuperados, ele deve permanecer marcado e rastreável até validação de paridade.
