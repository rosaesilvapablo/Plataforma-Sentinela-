import { useEffect, useState } from "react";
import { subscribeToPpl } from "@/data/ppl.repo";
import { type Ppl } from "@/domain/ppl";

export function usePplList() {
  const [rows, setRows] = useState<Ppl[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  useEffect(() => {
    return subscribeToPpl(
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
