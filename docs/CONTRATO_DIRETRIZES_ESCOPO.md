# Termo de Diretrizes e Escopo: Plataforma Sentinela (Web App)

## 1. Objetivo Geral e Princípio do Não-Retrocesso

O presente termo define as regras de negócio, o escopo arquitetural e as premissas funcionais obrigatórias para a Plataforma Sentinela em formato de Web Application.

Fica estabelecido o **Princípio do Não-Retrocesso Funcional**: nenhuma funcionalidade, módulo ou fluxo de dados presente no projeto original poderá ser suprimido, simplificado ou entregue com eficiência inferior. A reconstrução tem como objetivo a modernização tecnológica, otimização de performance, escalabilidade e aprimoramento das interfaces.

## 2. Escopo de Módulos e Regras de Negócio

A arquitetura do sistema deve ser modular e prever, obrigatoriamente, o mapeamento, a preservação e o aprimoramento estrutural dos seguintes domínios:

### 2.1. Gestão Administrativa e Institucional

**Gestão do Quadro de Pessoal:** Controle em tempo real de ausências, mapeamento de lotação paradigma versus lotação atual, e gerenciamento de servidores em regime de teletrabalho.

**Agenda Institucional:** Centralização de compromissos oficiais e prazos administrativos.

**Plantão Judicial:** Mapeamento de escalas, responsáveis e fluxos específicos de atuação em regime de plantão.

**Módulo Equipe & Calendário:** Preservação da gestão de equipe e aprimoramento obrigatório do calendário integrado de atividades.

### 2.2. Fluxo Processual e Produtividade (Inspeção/Correição)

**Fluxo de Entradas e Saídas:** Rastreamento dinâmico do ciclo de vida processual.

**Dados para Inspeção e Correição:** Painel específico com dados extraídos e consolidados para correições, destacando em tempo real os processos conclusos para:

- Despacho;
- Decisão;
- Sentença.

**Módulo de Expedientes:** Preservação e otimização do fluxo de emissão, controle e cumprimento de expedientes judiciais.

### 2.3. Execução Penal e Medidas Cautelares (PPL)

**Pessoas Privadas de Liberdade (PPL):** Gestão rigorosa e atualizada da situação carcerária.

**Revisão Preventiva (Art. 316, CPP):** Alertas e controle sistêmico de prazos para a revisão periódica de prisões preventivas.

**Classificação de Prisões:** Controle detalhado das espécies de prisão (preventiva, temporária, flagrante, etc.).

**Mandados e Difusão Vermelha:** Monitoramento centralizado de mandados de prisão pendentes de cumprimento e controle estrito de inclusões na lista de Difusão Vermelha da Interpol.

### 2.4. Gestão Financeira, Bens e Valores

**Controle de Recursos Financeiros:** Módulo dedicado ao rastreamento e gestão contábil de:

- Contas vinculadas a Acordos de Não Persecução Penal (ANPP);
- Prestações Pecuniárias (PRD);
- Conta Única.

**Módulo SISBAJUD, Depósitos e Recolhimentos:** Preservação e aprimoramento da gestão de bloqueios, transferências, depósitos judiciais e recolhimentos.

### 2.5. Estatística, Metas e Indicadores (Dashboards)

**Indicadores de Desempenho:** Geração de gráficos avançados e relatórios visuais precisos.

**Análise de Acervo:** Monitoramento de acervo em tramitação (Tram) e tramitação ajustada (Traj).

**Balanço de Fluxo:** Gráficos comparativos de entradas processuais versus saídas (baixas/arquivamentos).

**Módulo de Estatística e Metas:** Preservação integral com aprimoramento obrigatório das métricas de monitoramento de metas do CNJ/Tribunal.

## 3. Diretrizes Técnicas e Contrato de Refatoração

**Paridade de Funcionalidades (Feature Parity):** Antes de qualquer cutover de produção, o sistema deve passar por validação atestando que 100% dos recursos previstos estão operacionais.

**Arquitetura Robusta:** O código base não deve utilizar padrões simplificados ou atalhos técnicos (workarounds). Tipagem rigorosa, componentização modular e abstrações de dados alinhadas com as melhores práticas (ex: Clean Architecture).

**Aprimoramento Contínuo Declarado:** Os módulos de Estatística e Calendário não apenas migrarão de plataforma, mas deverão ser ativamente redesenhados para oferecer melhor usabilidade e precisão de dados.
