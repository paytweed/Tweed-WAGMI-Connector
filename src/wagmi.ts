import { Network } from "@paytweed/core-js";
import { createConfig, http } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { TweedConnector } from "./tweedConnector";

const appId = "YOUR-APP-ID";
const chains = [Network.ETHEREUM, Network.ETHEREUM_SEPOLIA];

export const config = createConfig({
  chains: [mainnet, sepolia],
  connectors: [new TweedConnector(appId, chains).createConnector()],

  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
