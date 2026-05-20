import { useEffect, useState } from "react";
import {
  subscribeToSisbajudOrdens,
  subscribeToDepositos,
} from "@/data/sisbajud.repo";
import { type SisbajudOrdem, type Deposito } from "@/domain/sisbajud";

export function useSisbajudOrdens() {
  const [rows, setRows] = useState<SisbajudOrdem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  useEffect(() => {
    return subscribeToSisbajudOrdens(
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

export function useDepositos() {
  const [rows, setRows] = useState<Deposito[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  useEffect(() => {
    return subscribeToDepositos(
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
