import { useState } from "react";
import { Pencil, Save } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { useOrientacoes } from "@/hooks/useRecolhimentos";
import { useAuth } from "@/auth/useAuth";
import { hasFullAccess } from "@/domain/roles";
import { saveOrientacoes } from "@/data/recolhimentos.repo";

export function OrientacoesTab() {
  const { orientacoes, loading, error } = useOrientacoes();
  const { role } = useAuth();
  const canEdit = hasFullAccess(role);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  function startEdit() {
    setDraft(orientacoes?.conteudo ?? "");
    setEditing(true);
  }

  async function onSave() {
    setSaving(true);
    try {
      await saveOrientacoes({ conteudo: draft });
      toast.success("Orientações atualizadas.");
      setEditing(false);
    } catch (err) {
      toast.error(formatError(err));
    } finally {
      setSaving(false);
    }
  }

  if (error) return <Alert tone="danger">Falha: {error.message}</Alert>;
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  const conteudo = orientacoes?.conteudo ?? "";

  if (editing && canEdit) {
    return (
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-medium">Editar orientações</h2>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setDraft(conteudo);
                setEditing(false);
              }}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button size="sm" onClick={() => void onSave()} loading={saving}>
              <Save className="h-3.5 w-3.5" /> Salvar
            </Button>
          </div>
        </div>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={20}
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-mono focus:outline-none focus-visible:ring-2 focus-visible:ring-sentinela-accent"
          placeholder="Insira orientações de recolhimento. Suporta texto simples (linhas em branco separam parágrafos)."
        />
        <p className="mt-2 text-xs text-slate-500">
          {draft.length}/20000 caracteres.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-medium">Orientações para recolhimento</h2>
        {canEdit ? (
          <Button variant="secondary" size="sm" onClick={startEdit}>
            <Pencil className="h-3.5 w-3.5" /> Editar
          </Button>
        ) : null}
      </div>
      {conteudo.trim().length === 0 ? (
        <p className="text-sm text-slate-500 py-6 text-center">
          {canEdit
            ? "Nenhuma orientação cadastrada. Clique em “Editar” para começar."
            : "Nenhuma orientação cadastrada."}
        </p>
      ) : (
        <article className="prose prose-slate max-w-none text-sm whitespace-pre-wrap leading-relaxed">
          {conteudo}
        </article>
      )}
      {orientacoes?.updatedAt && orientacoes.updatedByName ? (
        <p className="mt-4 text-xs text-slate-400 border-t pt-3">
          Atualizado em {orientacoes.updatedAt.toLocaleString("pt-BR")} por{" "}
          {orientacoes.updatedByName}.
        </p>
      ) : null}
    </Card>
  );
}

function formatError(err: unknown): string {
  if (typeof err === "object" && err && "message" in err) {
    return String((err as { message: unknown }).message);
  }
  return "Não foi possível salvar.";
}
