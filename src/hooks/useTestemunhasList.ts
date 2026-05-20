import { useEffect, useState } from "react";
import { subscribeToTestemunhas } from "@/data/testemunha.repo";
import { type Testemunha } from "@/domain/testemunha";

export function useTestemunhasList() {
  const [rows, setRows] = useState<Testemunha[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  useEffect(() => {
    return subscribeToTestemunhas(
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
