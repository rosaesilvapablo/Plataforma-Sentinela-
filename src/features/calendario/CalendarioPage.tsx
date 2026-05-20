import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { Alert } from "@/components/ui/Alert";
import { CalendarEventDialog } from "@/features/calendario/CalendarEventDialog";
import { ConfirmDeleteDialog } from "@/components/ui/ConfirmDeleteDialog";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { usePlantaoList } from "@/hooks/usePlantaoList";
import { useFrequenciaList } from "@/hooks/useFrequenciaList";
import { useExpedientesList } from "@/hooks/useExpedientesList";
import { usePplList } from "@/hooks/usePplList";
import { useAuth } from "@/auth/useAuth";
import { hasFullAccess } from "@/domain/roles";
import {
  CATEGORIA_LABELS,
  FONTE_LABELS,
  type AgregadoEvento,
  type CalendarEvent,
} from "@/domain/calendario";
import { classificarRevisao } from "@/domain/ppl";
import { deleteCalendarEvent } from "@/data/calendario.repo";
import { cn } from "@/lib/utils";

const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
] as const;

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as const;

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function buildGrid(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1);
  const startWeekday = firstDay.getDay();
  const start = new Date(year, month, 1 - startWeekday);
  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }
  return days;
}

function categoriaTone(cat: string): AgregadoEvento["tone"] {
  if (cat === "feriado") return "red";
  if (cat === "audiencia") return "blue";
  if (cat === "institucional") return "gold";
  return "neutral";
}

export function CalendarioPage() {
  const { role } = useAuth();
  const canAccess = hasFullAccess(role);

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogDate, setDialogDate] = useState<Date | undefined>();
  const [editTarget, setEditTarget] = useState<CalendarEvent | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CalendarEvent | null>(null);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const { rows: events, loading, error } = useCalendarEvents();
  const { rows: plantoes } = usePlantaoList();
  const { rows: frequencias } = useFrequenciaList();
  const { rows: expedientes } = useExpedientesList();
  const { rows: ppl } = usePplList();

  const grid = useMemo(() => buildGrid(year, month), [year, month]);

  const agregados: AgregadoEvento[] = useMemo(() => {
    const items: AgregadoEvento[] = [];

    // Eventos manuais
    for (const e of events) {
      items.push({
        data: e.data,
        titulo: e.titulo,
        fonte: "manual",
        tone: categoriaTone(e.categoria),
        detalhe: CATEGORIA_LABELS[e.categoria],
      });
    }

    // Plantoes: cada dia entre inicio e fim
    for (const p of plantoes) {
      const cur = new Date(p.dataInicio);
      while (cur.getTime() <= p.dataFim.getTime()) {
        items.push({
          data: new Date(cur),
          titulo: `Plantão · ${p.servidorNome}`,
          fonte: "plantao",
          tone: "blue",
          detalhe: `Juiz: ${p.juizNome}`,
        });
        cur.setDate(cur.getDate() + 1);
      }
    }

    // Frequencias: cada dia
    for (const f of frequencias) {
      const cur = new Date(f.dataInicio);
      while (cur.getTime() <= f.dataFim.getTime()) {
        items.push({
          data: new Date(cur),
          titulo: `${f.tipo === "falta_injustificada" ? "Falta" : "Ausência"} · ${f.memberNome}`,
          fonte: "frequencia",
          tone: f.tipo === "falta_injustificada" ? "red" : "gold",
          detalhe: f.motivo ?? "—",
        });
        cur.setDate(cur.getDate() + 1);
      }
    }

    // Expedientes: prazo
    for (const e of expedientes) {
      if (!e.prazoDevolucao) continue;
      if (e.status === "cumprido" || e.status === "cancelado") continue;
      items.push({
        data: e.prazoDevolucao,
        titulo: `Prazo · ${e.processo}`,
        fonte: "expediente_prazo",
        tone: "red",
        detalhe: e.assunto,
      });
    }

    // PPL: proxima revisao Art. 316
    for (const p of ppl) {
      if (!p.proximaRevisao) continue;
      const cls = classificarRevisao(p.proximaRevisao);
      if (cls.status === "ok") continue;
      items.push({
        data: p.proximaRevisao,
        titulo: `Art. 316 · ${p.nome}`,
        fonte: "ppl_revisao",
        tone: cls.status === "vencido" ? "red" : cls.status === "urgente" ? "red" : "gold",
        detalhe: p.processo,
      });
    }

    return items;
  }, [events, plantoes, frequencias, expedientes, ppl]);

  const byDay = useMemo(() => {
    const m = new Map<string, AgregadoEvento[]>();
    for (const a of agregados) {
      const key = `${a.data.getFullYear()}-${a.data.getMonth()}-${a.data.getDate()}`;
      const arr = m.get(key) ?? [];
      arr.push(a);
      m.set(key, arr);
    }
    return m;
  }, [agregados]);

  const eventsOnSelected = selectedDay
    ? agregados.filter((a) => sameDay(a.data, selectedDay))
    : [];

  const calendarEventOnSelected = selectedDay
    ? events.filter((e) => sameDay(e.data, selectedDay))
    : [];

  if (!canAccess) {
    return <Alert tone="warning">Calendário restrito a admin e diretor.</Alert>;
  }

  function prev() {
    if (month === 0) {
      setYear(year - 1);
      setMonth(11);
    } else {
      setMonth(month - 1);
    }
  }
  function next() {
    if (month === 11) {
      setYear(year + 1);
      setMonth(0);
    } else {
      setMonth(month + 1);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-sentinela-ink">Calendário</h1>
          <p className="text-sm text-slate-500">
            Eventos manuais + plantões, frequências, prazos de expedientes e revisões Art. 316.
          </p>
        </div>
        <Button
          onClick={() => {
            setDialogDate(undefined);
            setOpenDialog(true);
          }}
        >
          <Plus className="h-4 w-4" /> Novo evento
        </Button>
      </header>

      {error ? <Alert tone="danger">Falha: {error.message}</Alert> : null}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          <Card className="p-0">
            <header className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Button size="sm" variant="secondary" onClick={prev} aria-label="Mês anterior">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-base font-medium">
                  {MESES[month]} {year}
                </h2>
                <Button size="sm" variant="secondary" onClick={next} aria-label="Próximo mês">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setYear(today.getFullYear());
                  setMonth(today.getMonth());
                }}
              >
                Hoje
              </Button>
            </header>

            <div className="grid grid-cols-7 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-100">
              {DIAS_SEMANA.map((d) => (
                <div key={d} className="px-2 py-2 text-center">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {grid.map((d, i) => {
                const isCurrentMonth = d.getMonth() === month;
                const isToday = sameDay(d, today);
                const isSelected = selectedDay && sameDay(d, selectedDay);
                const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
                const dayEvents = byDay.get(key) ?? [];
                return (
                  <button
                    type="button"
                    key={i}
                    onClick={() => setSelectedDay(d)}
                    className={cn(
                      "min-h-[88px] border-r border-b border-slate-100 p-1.5 text-left text-xs hover:bg-slate-50 transition",
                      !isCurrentMonth && "bg-slate-50/50 text-slate-400",
                      isSelected && "ring-2 ring-sentinela-accent ring-inset",
                    )}
                  >
                    <div
                      className={cn(
                        "flex items-center justify-between mb-1",
                        isToday && "font-bold text-sentinela-accent",
                      )}
                    >
                      <span>{d.getDate()}</span>
                      {dayEvents.length > 0 ? (
                        <span className="text-[10px] text-slate-400">{dayEvents.length}</span>
                      ) : null}
                    </div>
                    <div className="space-y-0.5">
                      {dayEvents.slice(0, 3).map((e, idx) => (
                        <div
                          key={idx}
                          className={cn(
                            "truncate rounded px-1.5 py-0.5 text-[10px]",
                            e.tone === "red" && "bg-red-100 text-red-800",
                            e.tone === "gold" && "bg-amber-100 text-amber-900",
                            e.tone === "blue" && "bg-blue-100 text-blue-900",
                            e.tone === "green" && "bg-emerald-100 text-emerald-900",
                            e.tone === "neutral" && "bg-slate-100 text-slate-700",
                          )}
                          title={e.titulo}
                        >
                          {e.titulo}
                        </div>
                      ))}
                      {dayEvents.length > 3 ? (
                        <div className="text-[10px] text-slate-500">
                          +{dayEvents.length - 3} mais
                        </div>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          {selectedDay ? (
            <Card>
              <header className="flex items-center justify-between mb-3">
                <h3 className="text-base font-medium">
                  {selectedDay.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                </h3>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setDialogDate(selectedDay);
                    setOpenDialog(true);
                  }}
                >
                  <Plus className="h-3.5 w-3.5" /> Adicionar neste dia
                </Button>
              </header>

              {eventsOnSelected.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">
                  Nenhum evento neste dia.
                </p>
              ) : (
                <ul className="space-y-2">
                  {eventsOnSelected.map((e, i) => {
                    // Para eventos manuais, encontrar o CalendarEvent original para
                    // permitir editar/excluir
                    const original =
                      e.fonte === "manual"
                        ? calendarEventOnSelected.find((c) => c.titulo === e.titulo)
                        : null;
                    return (
                      <li
                        key={i}
                        className={cn(
                          "rounded-md border p-2 flex items-start justify-between gap-2",
                          e.tone === "red" && "border-red-200 bg-red-50",
                          e.tone === "gold" && "border-amber-200 bg-amber-50",
                          e.tone === "blue" && "border-blue-200 bg-blue-50",
                          e.tone === "green" && "border-emerald-200 bg-emerald-50",
                          e.tone === "neutral" && "border-slate-200 bg-slate-50",
                        )}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">{e.titulo}</p>
                            <span className="text-[10px] uppercase tracking-wider text-slate-500">
                              {FONTE_LABELS[e.fonte]}
                            </span>
                          </div>
                          {e.detalhe ? (
                            <p className="text-xs text-slate-600 mt-0.5">{e.detalhe}</p>
                          ) : null}
                        </div>
                        {original ? (
                          <div className="flex gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => setEditTarget(original)}
                              className="rounded p-1 text-slate-500 hover:bg-white"
                              aria-label="Editar"
                            >
                              ✎
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(original)}
                              className="rounded p-1 text-red-500 hover:bg-white"
                              aria-label="Excluir"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
          ) : null}
        </>
      )}

      <CalendarEventDialog
        open={openDialog}
        onClose={() => {
          setOpenDialog(false);
          setDialogDate(undefined);
        }}
        initialDate={dialogDate}
      />
      {editTarget ? (
        <CalendarEventDialog open existing={editTarget} onClose={() => setEditTarget(null)} />
      ) : null}
      {deleteTarget ? (
        <ConfirmDeleteDialog
          title="Excluir evento"
          message={`Excluir "${deleteTarget.titulo}"?`}
          onConfirm={async () => {
            await deleteCalendarEvent(deleteTarget.id);
          }}
          onClose={() => setDeleteTarget(null)}
        />
      ) : null}
    </div>
  );
}
