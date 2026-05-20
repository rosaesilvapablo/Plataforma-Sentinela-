import { ModulePlaceholder } from "@/components/ModulePlaceholder";

export function MesaTrabalhoPage() {
  return (
    <ModulePlaceholder
      title="Mesa de Trabalho"
      description="Kanban com colunas = estados processuais (concluso para despacho, decisao, sentenca, em diligencia, concluido)."
      next="A implementar: schema Zod, repositorio, regras Firestore, UI de quadro com drag-and-drop, maquina de transicoes."
    />
  );
}

export function CalendarioPage() {
  return (
    <ModulePlaceholder
      title="Calendario"
      description="Eventos manuais (feriados, institucionais) + eventos agregados em runtime (plantoes, ausencias, prazos de expedientes, revisoes Art. 316). View mes. Acesso restrito a admin/diretor."
    />
  );
}

export function SisbajudPage() {
  return (
    <ModulePlaceholder
      title="SISBAJUD & Depositos"
      description="Ordens SISBAJUD (1:N) depositos vinculados. Conciliacao visual: bloqueado x transferido x saldo. Timeline do desdobramento da ordem."
    />
  );
}

export function RecolhimentosPage() {
  return (
    <ModulePlaceholder
      title="Recolhimentos & Gestao"
      description="Painel de orientacoes (rich text editavel por admin/diretor) + Gestao de Contas (ANPP, PRD, Conta Unica) com extrato e destinacao rastreavel."
    />
  );
}

export function EstatisticasPage() {
  return (
    <ModulePlaceholder
      title="Estatisticas"
      description="Boletins tipo 1 (acervo) e tipo 4 (gerencial), mensais. Entrada via importacao CSV. Validacao cruzada com mes anterior."
    />
  );
}

export function MetasCnjPage() {
  return (
    <ModulePlaceholder
      title="Metas CNJ"
      description="Evolucao mensal de % de cumprimento das metas. Tabela + curva de tendencia + projecao 'se mantiver ritmo, cumpre/nao cumpre' com GAP."
    />
  );
}
