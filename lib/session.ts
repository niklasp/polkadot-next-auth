import "server-only";
import { JWTPayload, SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const secretKey = process.env.SESSION_SECRET;
const encodedKey = new TextEncoder().encode(secretKey);

interface PolkadotJWTPayload extends JWTPayload {
  accountAddress: string;
  userName?: string;
  subscriptionValidUntil?: number | null;
}

export async function encrypt(payload: PolkadotJWTPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encodedKey);
}

export async function decrypt(session: string | undefined = "") {
  try {
    const { payload } = await jwtVerify<PolkadotJWTPayload>(
      session,
      encodedKey,
      {
        algorithms: ["HS256"],
      }
    );
    console.log("decryptpayload", payload);
    return payload;
  } catch (error) {
    console.log("Failed to verify session", error);
  }
}

/**
 * Create a session for a user. This is only called after the user has passed the checks in
 * actions/auth.ts signIn
 */
export async function createSession(userId: string, userName?: string) {
  const expirationDuration = 7 * 24 * 60 * 60 * 1000; // 7 days
  const expiresAt = new Date(Date.now() + expirationDuration);
  const session = await encrypt({
    expiresAt,
    userName,
    accountAddress: userId,
  });
  const cookieStore = await cookies();

  // Set the session cookie
  cookieStore.set("session", session, {
    httpOnly: true,
    secure: true,
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });
}

export async function updateSession() {
  const session = (await cookies()).get("session")?.value;
  const payload = await decrypt(session);

  if (!session || !payload) {
    return null;
  }

  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const cookieStore = await cookies();
  cookieStore.set("session", session, {
    httpOnly: true,
    secure: true,
    expires: expires,
    sameSite: "lax",
    path: "/",
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
}
