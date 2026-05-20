import { useEffect, useState } from "react";
import { subscribeToBoletins } from "@/data/estatisticas.repo";
import { type Boletim } from "@/domain/estatisticas";

export function useBoletins() {
  const [rows, setRows] = useState<Boletim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  useEffect(() => {
    return subscribeToBoletins(
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
