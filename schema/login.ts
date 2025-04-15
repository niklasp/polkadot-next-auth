import { SS58String, getSs58AddressInfo } from "polkadot-api";
import { z } from "zod";

export const SignupFormSchema = z.object({
  signer: z
    .string()
    .length(48, { message: "Signer must be 48 characters long." })
    .trim()
    .pipe(
      z.custom<SS58String>((value) => {
        const info = getSs58AddressInfo(value);
        return info.isValid;
      }, "Invalid SS58 address")
    ),
  signature: z.string().min(1, { message: "Signature is required" }),
  signedMessage: z.object({
    statement: z.string(),
    uri: z.string().startsWith("http", {
      message: "URI must start with http or https",
    }),
    version: z.number(),
    challenge: z.string(),
  }),
  userName: z.string().optional(),
});

export type FormState =
  | {
      errors?: {
        signer?: string[];
        signature?: string[];
        signedMessage?: string[];
        userName?: string[];
      };
      error?: Error;
      message?: string;
    }
  | undefined;
