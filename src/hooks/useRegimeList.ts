import { useEffect, useState } from "react";
import { subscribeToRegimes } from "@/data/regimeTrabalho.repo";
import { type Regime } from "@/domain/regimeTrabalho";

export function useRegimeList() {
  const [rows, setRows] = useState<Regime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  useEffect(() => {
    return subscribeToRegimes(
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
