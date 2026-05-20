import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { TIPO_VINCULO_LABELS, type TipoVinculo } from "@/domain/team";

const tones: Record<TipoVinculo, BadgeTone> = {
  juiz: "gold",
  servidor: "blue",
  estagiario: "neutral",
  terceirizado: "neutral",
  cedido: "neutral",
  requisitado: "neutral",
  voluntario: "green",
};

export function TipoVinculoBadge({ tipo }: { tipo: TipoVinculo }) {
  return <Badge tone={tones[tipo]}>{TIPO_VINCULO_LABELS[tipo]}</Badge>;
}
