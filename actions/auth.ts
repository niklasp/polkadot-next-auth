"use server";

import { createSession, deleteSession } from "@/lib/session";
import { getTransactionsFromAddress } from "@/lib/get-transactions";
import { SignupFormSchema, FormState } from "@/schema/login";
import { signatureVerify, cryptoWaitReady } from "@polkadot/util-crypto";
import { redirect } from "next/navigation";
import { calculateSubscriptionLength } from "@/lib/calculate-subscription-length";
import { createClient, SS58String } from "polkadot-api";
import { getSmProvider } from "polkadot-api/sm-provider";
import { dot } from "@polkadot-api/descriptors";
import { chainSpec } from "polkadot-api/chains/polkadot";
import { startFromWorker } from "polkadot-api/smoldot/from-node-worker";
import { Worker } from "worker_threads";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import type { Client } from "polkadot-api/smoldot";

// Singleton worker instance
let worker: Worker | null = null;
let smoldot: Client | null = null;

// Initialize worker once
async function initializeWorker() {
  if (worker && smoldot) return { worker, smoldot };

  const currentFilePath = fileURLToPath(import.meta.url);
  const currentDir = dirname(currentFilePath);
  const workerPath = join(
    currentDir,
    "..",
    "node_modules",
    "polkadot-api",
    "dist",
    "reexports",
    "smoldot_node-worker.js"
  );

  worker = new Worker(workerPath);
  smoldot = startFromWorker(worker);

  return { worker, smoldot };
}

// Cleanup function to be called on server shutdown
export async function cleanupWorker() {
  if (smoldot) {
    await smoldot.terminate();
    smoldot = null;
  }
  if (worker) {
    worker.terminate();
    worker = null;
  }
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

  console.log(
    validatedFields.data,
    validatedFields.success,
    validatedFields?.error?.flatten().fieldErrors
  );

  // If any form fields are invalid, return early
  if (!validatedFields.success) {
    console.log("returning errors");
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { signer, signature, userName } = validatedFields.data;

  // 2. Verify signature

  // First, ensure WASM crypto is ready
  await cryptoWaitReady();

  const verifyResult = signatureVerify(
    formData.get("signedMessage") as string,
    signature,
    signer
  );

  if (!verifyResult.isValid) {
    return {
      errors: {
        signature: ["Invalid signature"],
      },
    };
  }

  // 3. Here you can add your own logic to verify the user,
  // e.g. check if the user has transferred a certain amount of funds
  // or has a certain role.
  console.log("getting nonce for", signer);

  // Get the nonce directly in this function
  const nonce = await getNonce(signer);
  console.log("nonce", nonce);

  // const transactions = await getTransactionsFromAddress(signer);
  // console.log("transactions", transactions);
  // const subscriptionValidUntil = calculateSubscriptionLength(transactions);
  // console.log("subscriptionValidUntil", subscriptionValidUntil);

  // 4. create user Session (JWT cookie)
  await createSession(signer, userName, nonce);

  // 5. redirect to some protected page
  redirect("/protected");
}

export async function logout() {
  deleteSession();
  redirect("/");
}

export async function getNonce(signer: SS58String): Promise<number> {
  try {
    const { smoldot: smoldotInstance } = await initializeWorker();
    const chain = await smoldotInstance.addChain({ chainSpec });

    // Get the provider
    const provider = getSmProvider(chain);

    // Create a client with the provider
    const client = createClient(provider);

    // Get the TypedApi
    const dotApi = client.getTypedApi(dot);

    // Get the account info
    const accountInfo = await dotApi.query.System.Account.getValue(signer);

    // Extract the nonce from the account info
    const nonce = accountInfo.nonce;

    return nonce;
  } catch (error) {
    console.error("Error getting nonce:", error);
    throw error;
  }
}
