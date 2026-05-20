import { useEffect, useState } from "react";
import { subscribeToCalendarEvents } from "@/data/calendario.repo";
import { type CalendarEvent } from "@/domain/calendario";

export function useCalendarEvents() {
  const [rows, setRows] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  useEffect(() => {
    return subscribeToCalendarEvents(
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
