import { useEffect, useState } from "react";
import { subscribeToOrientacoes, subscribeToMovimentos } from "@/data/recolhimentos.repo";
import { type Orientacoes, type Movimento } from "@/domain/recolhimentos";

export function useOrientacoes() {
  const [orientacoes, setOrientacoes] = useState<Orientacoes | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  useEffect(() => {
    return subscribeToOrientacoes(
      (n) => {
        setOrientacoes(n);
        setLoading(false);
      },
      (e) => {
        setError(e);
        setLoading(false);
      },
    );
  }, []);
  return { orientacoes, loading, error };
}

export function useMovimentos() {
  const [rows, setRows] = useState<Movimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  useEffect(() => {
    return subscribeToMovimentos(
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
