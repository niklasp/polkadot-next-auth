"use server";

import { cookies } from "next/headers";
import { decrypt } from "@/lib/session";

interface Session {
  isAuth: boolean;
  userName?: string;
  accountAddress: string;
}

export async function verifySession(): Promise<Session> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session");

  if (!sessionCookie?.value) {
    return {
      isAuth: false,
      userName: undefined,
      accountAddress: "",
    };
  }

  try {
    const session = await decrypt(sessionCookie.value);
    if (!session) {
      return {
        isAuth: false,
        userName: undefined,
        accountAddress: "",
      };
    }

    return {
      isAuth: true,
      userName: session.userName,
      accountAddress: session.accountAddress,
    };
  } catch {
    return {
      isAuth: false,
      userName: undefined,
      accountAddress: "",
    };
  }
}
