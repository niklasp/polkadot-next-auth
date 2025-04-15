"use client";

import { useEffect, useState } from "react";
import { verifySession } from "@/actions/verify-session";

interface Session {
  isAuth: boolean;
  userName?: string;
  accountAddress: string;
}

const initialSession: Session = {
  isAuth: false,
  userName: undefined,
  accountAddress: "",
};

export function useSession() {
  const [session, setSession] = useState<Session>(initialSession);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSession() {
      try {
        const sessionData = await verifySession();
        setSession(sessionData);
      } catch {
        setSession(initialSession);
      } finally {
        setIsLoading(false);
      }
    }

    loadSession();
  }, []);

  return { session, isLoading };
}
