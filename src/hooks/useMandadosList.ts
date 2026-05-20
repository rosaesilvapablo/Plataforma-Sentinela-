import { useEffect, useState } from "react";
import { subscribeToMandados } from "@/data/mandados.repo";
import { type Mandado } from "@/domain/mandados";

export function useMandadosList() {
  const [rows, setRows] = useState<Mandado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  useEffect(() => {
    return subscribeToMandados(
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
