import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { PERSON_STATUS_LABELS, type PersonStatus } from "@/domain/team";

const tones: Record<PersonStatus, BadgeTone> = {
  ativo: "green",
  afastado: "gold",
  desligado: "neutral",
};

export function PersonStatusBadge({ status }: { status: PersonStatus }) {
  return <Badge tone={tones[status]}>{PERSON_STATUS_LABELS[status]}</Badge>;
}
