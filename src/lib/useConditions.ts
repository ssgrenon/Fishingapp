import { useEffect, useState } from "react";
import type { Conditions, Report } from "./types";

interface State {
  conditions: Conditions | null;
  reports: Report[] | null;
  error: string | null;
  loading: boolean;
}

export function useConditions(): State {
  const [state, setState] = useState<State>({ conditions: null, reports: null, error: null, loading: true });

  useEffect(() => {
    let cancelled = false;
    const base = import.meta.env.BASE_URL;

    Promise.all([
      fetch(`${base}data/conditions.json`, { cache: "no-store" }).then((r) => {
        if (!r.ok) throw new Error(`conditions.json: ${r.status}`);
        return r.json() as Promise<Conditions>;
      }),
      fetch(`${base}data/reports.json`, { cache: "no-store" }).then((r) => {
        if (!r.ok) throw new Error(`reports.json: ${r.status}`);
        return r.json() as Promise<Report[]>;
      }),
    ])
      .then(([conditions, reports]) => {
        if (!cancelled) setState({ conditions, reports, error: null, loading: false });
      })
      .catch((err: Error) => {
        if (!cancelled) setState({ conditions: null, reports: null, error: err.message, loading: false });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
