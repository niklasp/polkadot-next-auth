"use server";

import { createSession, deleteSession } from "@/lib/session";
import { SignupFormSchema, FormState } from "@/schema/login";
import { signatureVerify, cryptoWaitReady } from "@polkadot/util-crypto";
import { redirect } from "next/navigation";
import { nanoid } from "nanoid";

// Store active challenges
const activeChallenges = new Map<
  string,
  { challenge: string; timestamp: number }
>();
const CHALLENGE_TTL = 5 * 60 * 1000; // 5 minutes

// Generate a new challenge for a user
export async function generateChallenge(signer: string): Promise<string> {
  const challenge = nanoid();
  activeChallenges.set(signer, {
    challenge,
    timestamp: Date.now(),
  });

  // Clean up old challenges
  const now = Date.now();
  for (const [key, value] of activeChallenges.entries()) {
    if (now - value.timestamp > CHALLENGE_TTL) {
      activeChallenges.delete(key);
    }
  }

  return challenge;
}

// Verify a challenge is valid
function verifyChallenge(signer: string, challenge: string): boolean {
  const stored = activeChallenges.get(signer);
  if (!stored) return false;

  // Remove the challenge after verification
  activeChallenges.delete(signer);

  return stored.challenge === challenge;
}

export async function signIn(
  state: FormState,
  formData: FormData
): Promise<FormState> {
  // 1. Validate form fields
  const validatedFields = SignupFormSchema.safeParse({
    signer: formData.get("signer"),
    signature: formData.get("signature"),
    signedMessage: JSON.parse(formData.get("signedMessage") as string),
    userName: formData.get("userName"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { signer, signature, userName, signedMessage } = validatedFields.data;

  // 2. Verify the challenge + signature
  if (!verifyChallenge(signer, signedMessage.challenge)) {
    return {
      errors: {
        signature: ["Invalid or expired challenge"],
      },
    };
  }

  await cryptoWaitReady();
  const verifyResult = signatureVerify(
    JSON.stringify(signedMessage),
    signature,
    signer
  );

  // 3. Here you can add your own logic to verify the user,
  // e.g. check if the user has transferred a certain amount of funds
  // or has a certain role. You will most likely want to query indexers,
  // polkadot chains or use other apis
  // TODO

  // const transactions = await getTransactionsFromAddress(signer);
  // console.log("transactions", transactions);
  // const subscriptionValidUntil = calculateSubscriptionLength(transactions);
  // console.log("subscriptionValidUntil", subscriptionValidUntil);

  // 4. create user Session (JWT cookie)

  if (!verifyResult.isValid) {
    return {
      errors: {
        signature: ["Invalid signature"],
      },
    };
  }

  // 4. Create user session
  await createSession(signer, userName);

  // 5. Redirect to protected page
  redirect("/protected");
}

export async function logout() {
  deleteSession();
  redirect("/");
}
