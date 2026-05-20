import { ModulePlaceholder } from "@/components/ModulePlaceholder";

export function FrequenciaTab() {
  return (
    <ModulePlaceholder
      title="Frequência"
      description="Ausências justificadas e faltas injustificadas. docId autogerado (corrige bug do legado onde userId era usado como docId e sobrescrevia histórico). Botão atalho previsto no Dashboard."
      next="A implementar — tarefa #20."
    />
  );
}
