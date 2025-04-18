"use client";

import { pas } from "@polkadot-api/descriptors";
import type { TypedApi } from "polkadot-api";

export interface ChainConfig {
  key: string;
  name: string;
  descriptors: typeof pas;
  endpoints: string[];
  explorerUrl?: string;
}

export type AvailableApis = TypedApi<typeof pas>;

export const chainConfig: ChainConfig[] = [
  {
    key: "pas",
    name: "Paseo",
    descriptors: pas,
    endpoints: ["wss://rpc.ibp.network/paseo"],
    explorerUrl: "https://paseo.subscan.io/",
  },
  // {
  //   key: "dot",
  //   name: "Polkadot",
  //   descriptors: dot,
  //   endpoints: ["wss://rpc.polkadot.io"],
  // },
];
