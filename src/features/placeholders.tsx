import { ModulePlaceholder } from "@/components/ModulePlaceholder";

export function EquipePage() {
  return (
    <ModulePlaceholder
      title="Equipe"
      description="Cadastro funcional, lotacao paradigma versus atual, e funcoes comissionadas."
      next="Proximo passo: implementacao do CRUD com schema Zod, regras Firestore e telas list/form."
    />
  );
}

export function AusenciasPage() {
  return (
    <ModulePlaceholder
      title="Ausencias"
      description="Solicitacao, calendario e consolidacao diretiva. Refinamento aplicado: docId autogerado (cada registro preservado)."
    />
  );
}

export function CalendarioPage() {
  return (
    <ModulePlaceholder
      title="Calendario Institucional"
      description="Compromissos oficiais, prazos administrativos e visao integrada com equipe, ausencias e plantoes. Redesenho obrigatorio."
    />
  );
}

export function PlantaoPage() {
  return (
    <ModulePlaceholder
      title="Plantao Judicial"
      description="Escalas, responsaveis e fluxos especificos do regime de plantao."
    />
  );
}

export function ExpedientesPage() {
  return (
    <ModulePlaceholder
      title="Expedientes"
      description="Fila, emissao, status e cumprimento de expedientes judiciais."
    />
  );
}

export function PplPage() {
  return (
    <ModulePlaceholder
      title="PPL e Medidas Cautelares"
      description="Pessoas privadas de liberdade, classificacao da prisao e alertas do Art. 316 CPP."
    />
  );
}

export function SisbajudPage() {
  return (
    <ModulePlaceholder
      title="SISBAJUD"
      description="Ordens, bloqueios e transferencias; alias legado sisbajud_orders preservado."
    />
  );
}

export function DepositosPage() {
  return (
    <ModulePlaceholder
      title="Depositos e Recolhimentos"
      description="ANPP, PRD, Conta Unica e depositos judiciais. Saldos e alocacoes."
    />
  );
}

export function EstatisticasPage() {
  return (
    <ModulePlaceholder
      title="Estatisticas, Metas e Dashboards"
      description="Indicadores, metas CNJ, Tram/Traj e balanco de fluxo entradas x saidas. Redesenho obrigatorio."
    />
  );
}
