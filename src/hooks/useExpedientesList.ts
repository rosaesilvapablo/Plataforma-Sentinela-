import { useEffect, useState } from "react";
import { subscribeToExpedientes } from "@/data/expediente.repo";
import { type Expediente } from "@/domain/expediente";

export function useExpedientesList() {
  const [rows, setRows] = useState<Expediente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  useEffect(() => {
    return subscribeToExpedientes(
      (next) => {
        setRows(next);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      },
    );
  }, []);
  return { rows, loading, error };
}
