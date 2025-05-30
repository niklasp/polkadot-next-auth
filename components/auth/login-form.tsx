"use client";

import { signIn, generateChallenge, logout } from "@/actions/auth";
import { usePolkadotExtension } from "@/providers/polkadot-extension-provider";
import { Binary } from "polkadot-api";
import { useActionState } from "react";
import { Button } from "../ui/button";
import { FormState } from "@/schema/login";
import { Loader } from "../ui/loader";
import { AnimatePresence } from "framer-motion";
import { ErrorAccountNotConnected } from "@/lib/errors";
import { useSession } from "@/hooks/use-session";

export function LoginForm() {
  const { activeSigner, selectedAccount } = usePolkadotExtension();
  const { session, isLoading } = useSession();

  // We provide a custom form action that will add client side signing to the form
  // and pass the signature along with the signer to the server action
  const handleLogin = async (prevState: FormState) => {
    if (!activeSigner || !selectedAccount) {
      return {
        error: new ErrorAccountNotConnected(),
      };
    }

    try {
      // Get a challenge from the server
      const challenge = await generateChallenge(selectedAccount.address);

      const message = {
        statement:
          "Sign in with polkadot extension to the example tokengated example dApp",
        uri: window.location.origin,
        version: 1,
        challenge, // Include the challenge in the message
      };

      const signedMessage = JSON.stringify(message);

      const signature = await activeSigner?.signBytes(
        Binary.fromText(signedMessage).asBytes()
      );

      if (!signature) {
        return {
          errors: {
            signer: ["Error signing message"],
          },
        };
      }

      const formData = new FormData();
      formData.set("signer", selectedAccount?.address ?? "");
      formData.set("userName", selectedAccount?.name ?? "");
      formData.set("signature", Binary.fromBytes(signature).asHex());
      formData.set("signedMessage", signedMessage);

      const result = await signIn(prevState, formData);
      return result;
    } catch (error) {
      if (error === "Error: Cancelled") {
        return {
          error: new Error("Signature cancelled"),
        };
      }

      return {};
    }
  };

  const [formState, loginAction, pending] = useActionState(handleLogin, {});

  if (isLoading) {
    return <Loader size={24} />;
  }

  if (session?.isAuth) {
    return (
      <div className="flex flex-col gap-2 items-center">
        <p>Welcome {session.userName}</p>
        <form action={logout}>
          <Button type="submit">Logout</Button>
        </form>
      </div>
    );
  }

  return (
    <form action={loginAction} className="flex flex-col gap-2 items-center">
      <Button type="submit" className="gap-0">
        Login with Polkadot{" "}
        <span>
          <AnimatePresence>{pending && <Loader size={24} />}</AnimatePresence>
        </span>
      </Button>
      <div className="flex flex-col gap-2 text-red-500 text-sm">
        {formState?.errors?.signer && (
          <div>
            <p>Signer Error</p>
            <ul>
              {formState.errors.signer.map((error) => (
                <li key={error}>- {error}</li>
              ))}
            </ul>
          </div>
        )}
        {formState?.errors?.signature && (
          <div>
            <p>Signature Error</p>
            <ul>
              {formState.errors.signature.map((error) => (
                <li key={error}>- {error}</li>
              ))}
            </ul>
          </div>
        )}
        {formState?.errors?.signedMessage && (
          <div>
            <p>Signed Message Error</p>
            <ul>
              {formState.errors.signedMessage.map((error) => (
                <li key={error}>- {error}</li>
              ))}
            </ul>
          </div>
        )}

        {formState?.error && (
          <div className="text-red-500">
            <p>{formState.error.message}</p>
          </div>
        )}
      </div>
    </form>
  );
}
