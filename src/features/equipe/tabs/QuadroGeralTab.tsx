import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { useTeamList } from "@/hooks/useTeamList";
import {
  TIPO_VINCULO_LABELS,
  type TipoVinculo,
  type TeamMember,
} from "@/domain/team";
import { PersonStatusBadge } from "@/features/equipe/components/PersonStatusBadge";

export function QuadroGeralTab() {
  const { team, loading, error } = useTeamList();

  if (error) {
    return <Alert tone="danger">Erro ao carregar equipe: {error.message}</Alert>;
  }
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }
  if (team.length === 0) {
    return (
      <Card>
        <p className="text-center text-slate-500 py-6">
          Nenhum membro cadastrado ainda. Vá para a aba <strong>Cadastro</strong> e adicione o
          primeiro.
        </p>
      </Card>
    );
  }

  const ativos = team.filter((m) => m.status === "ativo");
  const comFC = ativos.filter((m) => m.funcaoComissionada);
  const divergencias = ativos.filter((m) => m.lotacaoAtual !== m.lotacaoParadigma);

  // Agrupamento por tipoVinculo (so ativos)
  const byTipo = new Map<TipoVinculo, TeamMember[]>();
  for (const m of ativos) {
    const arr = byTipo.get(m.tipoVinculo) ?? [];
    arr.push(m);
    byTipo.set(m.tipoVinculo, arr);
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <p className="text-xs uppercase tracking-wider text-slate-500">Total ativo</p>
          <p className="mt-1 text-3xl font-semibold text-sentinela-ink">{ativos.length}</p>
          <p className="text-xs text-slate-500">{team.length} cadastrados</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wider text-slate-500">
            Com função comissionada
          </p>
          <p className="mt-1 text-3xl font-semibold text-sentinela-accent">{comFC.length}</p>
          <p className="text-xs text-slate-500">do total ativo</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wider text-slate-500">Lotação divergente</p>
          <p className="mt-1 text-3xl font-semibold text-amber-600">{divergencias.length}</p>
          <p className="text-xs text-slate-500">paradigma ≠ atual</p>
        </Card>
      </div>

      <div className="space-y-4">
        {Array.from(byTipo.entries()).map(([tipo, members]) => (
          <Card key={tipo} className="p-0">
            <header className="flex items-center justify-between px-6 py-3 border-b border-slate-100">
              <h2 className="text-base font-medium">{TIPO_VINCULO_LABELS[tipo]}</h2>
              <Badge tone="neutral">{members.length}</Badge>
            </header>
            <ul className="divide-y divide-slate-100">
              {members.map((m) => (
                <li
                  key={m.uid}
                  className="px-6 py-3 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-sentinela-ink truncate">
                      {m.nome}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {m.cargoEfetivo}
                      {m.funcaoComissionada ? ` · ${m.funcaoComissionada}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {m.lotacaoAtual !== m.lotacaoParadigma ? (
                      <span
                        title={`Paradigma: ${m.lotacaoParadigma} → Atual: ${m.lotacaoAtual}`}
                        className="text-xs text-amber-700 whitespace-nowrap"
                      >
                        ⚠ divergente
                      </span>
                    ) : null}
                    <span className="text-xs text-slate-500 hidden sm:inline">
                      {m.lotacaoAtual}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>

      {team.some((m) => m.status !== "ativo") ? (
        <Card>
          <h2 className="text-base font-medium mb-3">Outros status</h2>
          <ul className="divide-y divide-slate-100">
            {team
              .filter((m) => m.status !== "ativo")
              .map((m) => (
                <li key={m.uid} className="py-2 flex items-center justify-between">
                  <span className="text-sm">
                    {m.nome}
                    <span className="ml-2 text-xs text-slate-500">{m.cargoEfetivo}</span>
                  </span>
                  <PersonStatusBadge status={m.status} />
                </li>
              ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}
