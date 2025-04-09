import "server-only";

import { cookies } from "next/headers";
import { decrypt } from "@/lib/session";
import { redirect } from "next/navigation";
import { cache } from "react";

// This is the data access layer for the application.
// It is used to centralize data access logic.
// https://nextjs.org/docs/app/building-your-application/authentication#creating-a-data-access-layer-dal

export const verifySession = cache(async () => {
  const cookie = (await cookies()).get("session")?.value;
  const session = await decrypt(cookie);

  if (!session?.accountAddress) {
    redirect("/?error=Not authorized");
  }

  return {
    isAuth: true,
    userName: session.userName,
    accountAddress: session.accountAddress,
    subscriptionValidUntil: session.subscriptionValidUntil,
  };
});

export const verifySubscription = cache(async () => {
  const session = await verifySession();
  if (
    !session.subscriptionValidUntil ||
    session.subscriptionValidUntil < Date.now()
  ) {
    redirect("/subscribe?error=Please subscribe to the service");
  }

  return session;
});
