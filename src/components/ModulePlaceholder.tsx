import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export function ModulePlaceholder({
  title,
  description,
  next,
}: {
  title: string;
  description: string;
  next?: string;
}) {
  return (
    <div className="space-y-4">
      <header className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <Badge tone="gold">Em construcao</Badge>
      </header>
      <Card>
        <p className="text-sm text-slate-600">{description}</p>
        {next ? <p className="mt-3 text-sm text-slate-500">{next}</p> : null}
      </Card>
    </div>
  );
}
