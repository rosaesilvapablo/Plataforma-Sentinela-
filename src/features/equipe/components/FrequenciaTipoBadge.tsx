import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { FREQUENCIA_TIPO_LABELS, type FrequenciaTipo } from "@/domain/frequencia";

const tones: Record<FrequenciaTipo, BadgeTone> = {
  ausencia_justificada: "blue",
  falta_injustificada: "red",
};

export function FrequenciaTipoBadge({ tipo }: { tipo: FrequenciaTipo }) {
  return <Badge tone={tones[tipo]}>{FREQUENCIA_TIPO_LABELS[tipo]}</Badge>;
}
