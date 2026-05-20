import { useState, type ChangeEvent } from "react";
import Papa from "papaparse";
import { toast } from "sonner";
import { Upload, AlertCircle } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import {
  tipoBoletimSchema,
  TIPO_BOLETIM_LABELS,
  compararBoletins,
  type TipoBoletim,
  type Boletim,
} from "@/domain/estatisticas";
import { createBoletim } from "@/data/estatisticas.repo";

const TIPOS: TipoBoletim[] = [...tipoBoletimSchema.options];

function currentPeriod(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

type ParsedRow = { indicador: string; valor: number };

function parseCsv(text: string): { rows: ParsedRow[]; errors: string[] } {
  const errors: string[] = [];
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase(),
  });
  if (result.errors.length > 0) {
    for (const e of result.errors) errors.push(`Linha ${e.row}: ${e.message}`);
  }
  const rows: ParsedRow[] = [];
  for (const r of result.data) {
    const ind = (r.indicador ?? r.nome ?? "").trim();
    const valStr = (r.valor ?? r.valor_atual ?? "").trim();
    if (!ind) continue;
    const valor = Number(valStr.replace(",", "."));
    if (!Number.isFinite(valor)) {
      errors.push(`Indicador "${ind}": valor inválido ("${valStr}").`);
      continue;
    }
    rows.push({ indicador: ind, valor });
  }
  return { rows, errors };
}

export function BoletimImportDialog({
  open,
  onClose,
  previousByType,
}: {
  open: boolean;
  onClose: () => void;
  previousByType: Map<TipoBoletim, Boletim | null>;
}) {
  const [tipo, setTipo] = useState<TipoBoletim>("tipo_1");
  const [periodo, setPeriodo] = useState(currentPeriod());
  const [observacoes, setObservacoes] = useState("");
  const [parsed, setParsed] = useState<ParsedRow[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setError(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = String(ev.target?.result ?? "");
      const { rows, errors } = parseCsv(text);
      setParsed(rows);
      setParseErrors(errors);
    };
    reader.readAsText(file, "UTF-8");
  }

  async function onSave() {
    setError(null);
    if (parsed.length === 0) {
      setError("CSV sem indicadores válidos.");
      return;
    }
    setSaving(true);
    try {
      const indicadores: Record<string, number> = {};
      for (const r of parsed) indicadores[r.indicador] = r.valor;
      await createBoletim({
        periodo,
        tipo,
        indicadores,
        observacoes,
      });
      toast.success(`Boletim ${TIPO_BOLETIM_LABELS[tipo]} (${periodo}) importado.`);
      close();
    } catch (err) {
      setError(formatError(err));
    } finally {
      setSaving(false);
    }
  }

  function close() {
    setParsed([]);
    setParseErrors([]);
    setFileName(null);
    setObservacoes("");
    setError(null);
    onClose();
  }

  const previous = previousByType.get(tipo) ?? null;
  const alerts =
    parsed.length > 0 && previous
      ? compararBoletins(
          {
            id: "preview",
            periodo,
            tipo,
            indicadores: Object.fromEntries(parsed.map((r) => [r.indicador, r.valor])),
            observacoes: null,
          },
          previous,
        )
      : [];

  return (
    <Modal open={open} onClose={close} title="Importar boletim (CSV)" className="max-w-3xl">
      <div className="space-y-4">
        {error ? <Alert tone="danger">{error}</Alert> : null}

        <Alert tone="info" className="text-xs">
          Formato CSV esperado: cabeçalho <code>indicador,valor</code>. Valores numéricos com
          ponto ou vírgula decimal.
        </Alert>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Tipo" htmlFor="tipo" required>
            <select
              id="tipo"
              value={tipo}
              onChange={(e) => setTipo(e.target.value as TipoBoletim)}
              className="w-full h-10 rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-sentinela-accent"
            >
              {TIPOS.map((t) => (
                <option key={t} value={t}>
                  {TIPO_BOLETIM_LABELS[t]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Período" htmlFor="periodo" required hint="YYYY-MM">
            <Input
              id="periodo"
              type="month"
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
            />
          </Field>
        </div>

        <Field label="Arquivo CSV" htmlFor="csv-file" required>
          <label
            htmlFor="csv-file"
            className="flex items-center gap-2 rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm cursor-pointer hover:bg-slate-100"
          >
            <Upload className="h-4 w-4 text-slate-500" />
            <span className="text-slate-700">
              {fileName ?? "Selecionar arquivo CSV…"}
            </span>
          </label>
          <input
            id="csv-file"
            type="file"
            accept=".csv,text/csv"
            onChange={onFile}
            className="sr-only"
          />
        </Field>

        {parseErrors.length > 0 ? (
          <Alert tone="warning">
            <p className="font-medium mb-1">Avisos no parse:</p>
            <ul className="list-disc list-inside text-xs space-y-0.5">
              {parseErrors.slice(0, 5).map((e, i) => (
                <li key={i}>{e}</li>
              ))}
              {parseErrors.length > 5 ? (
                <li>… e mais {parseErrors.length - 5}.</li>
              ) : null}
            </ul>
          </Alert>
        ) : null}

        {parsed.length > 0 ? (
          <>
            <div className="text-sm font-medium">
              Preview ({parsed.length} indicador{parsed.length === 1 ? "" : "es"})
            </div>
            <div className="max-h-64 overflow-auto rounded-md border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Indicador</th>
                    <th className="px-3 py-2 text-right">Valor</th>
                    <th className="px-3 py-2 text-right">vs anterior</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {parsed.map((r) => {
                    const al = alerts.find((a) => a.indicador === r.indicador);
                    return (
                      <tr key={r.indicador}>
                        <td className="px-3 py-2">{r.indicador}</td>
                        <td className="px-3 py-2 text-right font-mono">
                          {r.valor.toLocaleString("pt-BR")}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {al ? (
                            <span
                              className={`inline-flex items-center gap-1 text-xs ${
                                al.deltaPct < 0 ? "text-red-700" : "text-amber-700"
                              }`}
                            >
                              <AlertCircle className="h-3 w-3" />
                              {al.deltaPct.toFixed(1)}%
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {alerts.length > 0 ? (
              <Alert tone="warning" className="text-xs">
                {alerts.length} indicador(es) com variação ≥ 30% em relação ao período anterior.
                Confira antes de salvar.
              </Alert>
            ) : null}
          </>
        ) : null}

        <Field label="Observações" htmlFor="obs">
          <textarea
            id="obs"
            rows={2}
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-sentinela-accent"
          />
        </Field>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={close} disabled={saving}>
            Cancelar
          </Button>
          <Button
            onClick={() => void onSave()}
            loading={saving}
            disabled={parsed.length === 0}
          >
            Salvar boletim
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function formatError(err: unknown): string {
  if (typeof err === "object" && err && "message" in err) {
    return String((err as { message: unknown }).message);
  }
  return "Não foi possível salvar.";
}
