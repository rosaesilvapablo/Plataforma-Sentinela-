import { useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  AlertTriangle,
  CalendarPlus,
  ClipboardList,
  Coins,
  Gavel,
  ScrollText,
  Target,
  Users,
  Wallet,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { useAuth } from "@/auth/useAuth";
import { hasFullAccess, ROLE_LABELS } from "@/domain/roles";
import { CreateFrequenciaDialog } from "@/features/equipe/dialogs/CreateFrequenciaDialog";
import { usePplList } from "@/hooks/usePplList";
import { useExpedientesList } from "@/hooks/useExpedientesList";
import { useMandadosList } from "@/hooks/useMandadosList";
import { useMetas } from "@/hooks/useMetas";
import { useMovimentos } from "@/hooks/useRecolhimentos";
import { classificarRevisao } from "@/domain/ppl";
import { classificarPrazo } from "@/domain/expediente";
import { calcularSaldo, CONTA_GERIDA_LABELS, formatMoney } from "@/domain/recolhimentos";

export function DashboardHome() {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const canWrite = hasFullAccess(role);
  const [createFreqOpen, setCreateFreqOpen] = useState(false);

  // Subscriptions reativas (atualizam sem F5)
  const { rows: ppl } = usePplList();
  const { rows: expedientes } = useExpedientesList();
  const { rows: mandados } = useMandadosList();
  const { rows: metas } = useMetas();
  const { rows: movimentos } = useMovimentos();

  // Alertas agregados
  const pplVencidos = useMemo(
    () =>
      ppl.filter((p) => classificarRevisao(p.proximaRevisao).status === "vencido"),
    [ppl],
  );
  const pplUrgentes = useMemo(
    () =>
      ppl.filter((p) => classificarRevisao(p.proximaRevisao).status === "urgente"),
    [ppl],
  );
  const expedientesVencidos = useMemo(
    () =>
      expedientes.filter(
        (e) => classificarPrazo(e.prazoDevolucao, e.status).status === "vencido",
      ),
    [expedientes],
  );
  const mandadosAtivos = useMemo(
    () => mandados.filter((m) => m.status === "ativo"),
    [mandados],
  );
  const metasCriticas = useMemo(() => {
    // Pega a última evolução de cada meta e marca como crítica se < 50%
    const ultimas = new Map<string, number>();
    const sorted = [...metas].sort((a, b) => b.periodo.localeCompare(a.periodo));
    for (const m of sorted) {
      if (!ultimas.has(m.codigo)) ultimas.set(m.codigo, m.percentual);
    }
    return Array.from(ultimas.entries()).filter(([, p]) => p < 50);
  }, [metas]);

  const saldosNegativos = useMemo(() => {
    const contas: Array<"anpp" | "prd" | "conta_unica"> = ["anpp", "prd", "conta_unica"];
    const out: Array<{ conta: typeof contas[number]; saldo: number }> = [];
    for (const c of contas) {
      const saldo = calcularSaldo(movimentos.filter((m) => m.conta === c));
      if (saldo < 0) out.push({ conta: c, saldo });
    }
    return out;
  }, [movimentos]);

  const totalAlertas =
    pplVencidos.length +
    pplUrgentes.length +
    expedientesVencidos.length +
    metasCriticas.length +
    saldosNegativos.length;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Sala de Situação</h1>
        <p className="text-sm text-slate-500">
          Bem-vindo, {user?.displayName || user?.email}. Perfil:{" "}
          {role ? ROLE_LABELS[role] : "—"}.
        </p>
      </header>

      {/* Atalhos rápidos */}
      {canWrite ? (
        <section>
          <h2 className="text-xs uppercase tracking-wider text-slate-500 mb-2">
            Atalhos rápidos
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Card className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-sentinela-accent/10 p-2 text-sentinela-accent">
                  <CalendarPlus className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-sm">Lançar frequência</p>
                  <p className="text-xs text-slate-500">Ausência ou falta</p>
                </div>
              </div>
              <Button size="sm" onClick={() => setCreateFreqOpen(true)}>
                Lançar
              </Button>
            </Card>
            <Card className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-50 p-2 text-blue-700">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-sm">Equipe</p>
                  <p className="text-xs text-slate-500">Cadastro / Quadro</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => navigate("/equipe?tab=quadro")}
              >
                Ir
              </Button>
            </Card>
            <Card className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-amber-50 p-2 text-amber-700">
                  <ClipboardList className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-sm">Mesa de Trabalho</p>
                  <p className="text-xs text-slate-500">Kanban processual</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => navigate("/mesa")}
              >
                Ir
              </Button>
            </Card>
          </div>
        </section>
      ) : null}

      {/* Alertas acionáveis */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs uppercase tracking-wider text-slate-500">
            Alertas acionáveis
          </h2>
          <Badge tone={totalAlertas > 0 ? "red" : "green"}>
            {totalAlertas === 0 ? "Tudo em dia ✓" : `${totalAlertas} alerta(s)`}
          </Badge>
        </div>

        {totalAlertas === 0 ? (
          <Card>
            <p className="text-sm text-slate-500 text-center py-3">
              Nenhum alerta crítico no momento.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {pplVencidos.length > 0 ? (
              <AlertCard
                icon={<Gavel className="h-4 w-4" />}
                title="Art. 316 vencidos"
                count={pplVencidos.length}
                tone="red"
                description="Revisões fora do prazo de 90 dias."
                href="/ppl"
                navigate={navigate}
              />
            ) : null}
            {pplUrgentes.length > 0 ? (
              <AlertCard
                icon={<AlertTriangle className="h-4 w-4" />}
                title="Art. 316 nos próximos 7 dias"
                count={pplUrgentes.length}
                tone="gold"
                description="Revisões urgentes a agendar."
                href="/ppl"
                navigate={navigate}
              />
            ) : null}
            {expedientesVencidos.length > 0 ? (
              <AlertCard
                icon={<ScrollText className="h-4 w-4" />}
                title="Expedientes vencidos"
                count={expedientesVencidos.length}
                tone="red"
                description="Prazo de devolução estourado."
                href="/expedientes"
                navigate={navigate}
              />
            ) : null}
            {mandadosAtivos.length > 0 ? (
              <AlertCard
                icon={<AlertCircle className="h-4 w-4" />}
                title="Mandados ativos"
                count={mandadosAtivos.length}
                tone="gold"
                description="Pendentes / difusão / revisão."
                href="/ppl?tab=mandados"
                navigate={navigate}
              />
            ) : null}
            {metasCriticas.length > 0 ? (
              <AlertCard
                icon={<Target className="h-4 w-4" />}
                title="Metas CNJ críticas"
                count={metasCriticas.length}
                tone="red"
                description="Cumprimento abaixo de 50%."
                href="/metas"
                navigate={navigate}
              />
            ) : null}
            {saldosNegativos.map((s) => (
              <AlertCard
                key={s.conta}
                icon={<Wallet className="h-4 w-4" />}
                title={`${CONTA_GERIDA_LABELS[s.conta].split(" — ")[0]}: saldo negativo`}
                count={null}
                tone="red"
                description={formatMoney(s.saldo)}
                href="/recolhimentos?tab=contas"
                navigate={navigate}
              />
            ))}
          </div>
        )}
      </section>

      {/* Snapshot rápido */}
      <section>
        <h2 className="text-xs uppercase tracking-wider text-slate-500 mb-2">Resumo</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card>
            <div className="flex items-center gap-2 text-slate-500 text-xs">
              <Gavel className="h-3.5 w-3.5" /> PPL
            </div>
            <p className="mt-1 text-2xl font-semibold">{ppl.length}</p>
          </Card>
          <Card>
            <div className="flex items-center gap-2 text-slate-500 text-xs">
              <ScrollText className="h-3.5 w-3.5" /> Expedientes
            </div>
            <p className="mt-1 text-2xl font-semibold">{expedientes.length}</p>
          </Card>
          <Card>
            <div className="flex items-center gap-2 text-slate-500 text-xs">
              <Target className="h-3.5 w-3.5" /> Metas registradas
            </div>
            <p className="mt-1 text-2xl font-semibold">{metas.length}</p>
          </Card>
          <Card>
            <div className="flex items-center gap-2 text-slate-500 text-xs">
              <Coins className="h-3.5 w-3.5" /> Movimentos
            </div>
            <p className="mt-1 text-2xl font-semibold">{movimentos.length}</p>
          </Card>
        </div>
      </section>

      {!canWrite ? (
        <Alert tone="info" className="text-xs">
          Como {role ? ROLE_LABELS[role] : "usuário"}, você visualiza alertas mas algumas ações
          são restritas a admin/diretor.
        </Alert>
      ) : null}

      {canWrite ? (
        <CreateFrequenciaDialog
          open={createFreqOpen}
          onClose={() => setCreateFreqOpen(false)}
        />
      ) : null}
    </div>
  );
}

function AlertCard({
  icon,
  title,
  count,
  tone,
  description,
  href,
  navigate,
}: {
  icon: ReactNode;
  title: string;
  count: number | null;
  tone: "red" | "gold";
  description: string;
  href: string;
  navigate: (to: string) => void;
}) {
  const styles =
    tone === "red"
      ? { border: "border-red-200", bg: "bg-red-50", text: "text-red-900", count: "text-red-700" }
      : {
          border: "border-amber-200",
          bg: "bg-amber-50",
          text: "text-amber-900",
          count: "text-amber-700",
        };
  return (
    <button
      type="button"
      onClick={() => navigate(href)}
      className={`text-left rounded-lg border ${styles.border} ${styles.bg} p-4 hover:brightness-95 transition`}
    >
      <div className={`flex items-center gap-2 ${styles.text}`}>
        {icon}
        <p className="text-sm font-medium">{title}</p>
      </div>
      {count !== null ? (
        <p className={`mt-1 text-3xl font-semibold ${styles.count}`}>{count}</p>
      ) : null}
      <p className={`mt-1 text-xs ${styles.text} opacity-80`}>{description}</p>
    </button>
  );
}
