"use server";

import { cookies } from "next/headers";
import { decrypt } from "@/lib/session";
import { redirect } from "next/navigation";

interface Session {
  isAuth: boolean;
  userName?: string;
  accountAddress: string;
  subscriptionValidUntil: number | null;
}

export async function verifySession(): Promise<Session> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session");

  if (!sessionCookie?.value) {
    return {
      isAuth: false,
      userName: undefined,
      accountAddress: "",
      subscriptionValidUntil: null,
    };
  }

  try {
    const session = await decrypt(sessionCookie.value);
    if (!session) {
      return {
        isAuth: false,
        userName: undefined,
        accountAddress: "",
        subscriptionValidUntil: null,
      };
    }

    return {
      isAuth: true,
      userName: session.userName,
      accountAddress: session.accountAddress,
      subscriptionValidUntil: session.subscriptionValidUntil ?? null,
    };
  } catch {
    return {
      isAuth: false,
      userName: undefined,
      accountAddress: "",
      subscriptionValidUntil: null,
    };
  }
}

export async function verifySubscription(): Promise<Session> {
  const session = await verifySession();
  if (
    !session.subscriptionValidUntil ||
    session.subscriptionValidUntil < Date.now()
  ) {
    redirect(
      "/subscribe?error=Please subscribe to the service before accessing this page"
    );
  }
  return session;
}
