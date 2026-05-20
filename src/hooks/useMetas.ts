import { useEffect, useState } from "react";
import { subscribeToMetas } from "@/data/metas.repo";
import { type MetaEvolucao } from "@/domain/metas";

export function useMetas() {
  const [rows, setRows] = useState<MetaEvolucao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  useEffect(() => {
    return subscribeToMetas(
      (n) => {
        setRows(n);
        setLoading(false);
      },
      (e) => {
        setError(e);
        setLoading(false);
      },
    );
  }, []);
  return { rows, loading, error };
}
