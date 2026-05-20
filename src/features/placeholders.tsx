import { ModulePlaceholder } from "@/components/ModulePlaceholder";

export function CalendarioPage() {
  return (
    <ModulePlaceholder
      title="Calendario"
      description="Eventos manuais (feriados, institucionais) + eventos agregados em runtime (plantoes, ausencias, prazos de expedientes, revisoes Art. 316). View mes. Acesso restrito a admin/diretor."
    />
  );
}
