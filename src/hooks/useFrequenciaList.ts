import { useEffect, useState } from "react";
import { subscribeToFrequencias } from "@/data/frequencia.repo";
import { type Frequencia } from "@/domain/frequencia";

export type UseFrequenciaListResult = {
  rows: Frequencia[];
  loading: boolean;
  error: Error | null;
};

export function useFrequenciaList(): UseFrequenciaListResult {
  const [rows, setRows] = useState<Frequencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    return subscribeToFrequencias(
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
