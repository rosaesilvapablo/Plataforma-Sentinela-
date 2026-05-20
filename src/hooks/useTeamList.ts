import { useEffect, useState } from "react";
import { subscribeToTeam } from "@/data/team.repo";
import { type TeamMember } from "@/domain/team";

export type UseTeamListResult = {
  team: TeamMember[];
  loading: boolean;
  error: Error | null;
};

export function useTeamList(): UseTeamListResult {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToTeam(
      (next) => {
        setTeam(next);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      },
    );
    return unsubscribe;
  }, []);

  return { team, loading, error };
}
