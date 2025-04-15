import { Button } from "@/components/ui/button";
import { logout } from "@/actions/auth";
import { Identicon } from "@/components/account/identicon";

import { verifySession } from "@/actions/verify-session";
import Link from "next/link";

export default async function ProtectedPage() {
  const session = await verifySession();
  console.log("session", session);
  if (!session.isAuth) {
    return (
      <main className="flex min-h-screen p-8 pb-20 flex-col gap-[32px] row-start-2 items-center justify-center relative">
        <h1 className="text-4xl font-bold">🔒 Protected Page</h1>
        <div className="flex items-center gap-2">
          <p>Not authenticated</p>
        </div>
        <Link href="/">
          <Button>← Go Back</Button>
        </Link>
      </main>
    );
  }
  return (
    <main className="flex min-h-screen p-8 pb-20 flex-col gap-[32px] row-start-2 items-center justify-center relative">
      <h1 className="text-4xl font-bold">🔒 Protected Page</h1>
      <div className="flex items-center gap-2">
        <p>Welcome {session.userName}</p>
        <Identicon address={session.accountAddress} />
      </div>
      <em className="text-sm text-muted-foreground">
        You are successfully logged in and your session is securely stored in a
        secure browser cookie. Try refreshing the page or opening another
        browser tab.
      </em>
      <div className="flex flex-col md:flex-row gap-4">
        <Button onClick={logout}>Logout</Button>
      </div>
    </main>
  );
}
