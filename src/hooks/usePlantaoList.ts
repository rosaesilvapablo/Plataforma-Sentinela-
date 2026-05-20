import { useEffect, useState } from "react";
import { subscribeToPlantoes } from "@/data/plantao.repo";
import { type Plantao } from "@/domain/plantao";

export function usePlantaoList() {
  const [rows, setRows] = useState<Plantao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  useEffect(() => {
    return subscribeToPlantoes(
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
