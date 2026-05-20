import { useEffect, useState } from "react";
import { subscribeToUsers } from "@/data/users.repo";
import { type AccessListUser } from "@/domain/users";

export type UseUsersListResult = {
  users: AccessListUser[];
  loading: boolean;
  error: Error | null;
};

export function useUsersList(): UseUsersListResult {
  const [users, setUsers] = useState<AccessListUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToUsers(
      (next) => {
        setUsers(next);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      },
    );
    return unsubscribe;
  }, []);

  return { users, loading, error };
}
