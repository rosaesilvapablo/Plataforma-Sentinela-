import { useEffect, useState } from "react";
import { subscribeToMesaCards } from "@/data/mesaCard.repo";
import { type MesaCard } from "@/domain/mesaCard";

export function useMesaCards() {
  const [rows, setRows] = useState<MesaCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  useEffect(() => {
    return subscribeToMesaCards(
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
