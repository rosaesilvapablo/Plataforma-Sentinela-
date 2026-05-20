import { ModulePlaceholder } from "@/components/ModulePlaceholder";

export function LogsTab() {
  return (
    <ModulePlaceholder
      title="Logs / Auditoria"
      description="audit_logs preenchidos por trigger Cloud Function (cliente não escreve). Operações críticas: criação/desativação de usuário, troca de role, alterações em Testemunhas Protegidas e em contas financeiras. A implementar."
    />
  );
}
