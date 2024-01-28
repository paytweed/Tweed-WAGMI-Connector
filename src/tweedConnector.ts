import { Network, TweedClient } from "@paytweed/core-js";
import { EthereumProvider } from "@paytweed/core-js/lib/Eip1193Provider";
import { createConnector } from "@wagmi/core";

export const getTweedConnector = async () => {
  let provider: EthereumProvider | undefined;
  const client = await TweedClient.create("YOUR-APP-ID", {
    chains: [Network.ETHEREUM, Network.ETHEREUM_SEPOLIA],
  });

  const ensureConnected = async () => {
    const isAuthorized = client.isAuthenticated;
    if (!isAuthorized) await client.connect();
  };

  const initializeProvider = async (chainId: number) => {
    if (!provider) {
      provider = await client.getEthereumProvider(chainId);
    }
  };

  const tweedConnector = createConnector<EthereumProvider>((config) => ({
    id: "tweed",
    name: "Tweed",
    icon: "https://paytweed-assets.s3.amazonaws.com/logo-square-black.png",
    type: "injected",

    async connect() {
      await ensureConnected();
      const defaultChainId = config.chains.at(0)?.id || 0;
      await initializeProvider(defaultChainId);
      const accounts = await provider?.request({
        method: "eth_accounts",
      });

      const chainId = await provider?.request({
        method: "eth_chainId",
      });
      const normalizedChainId = normalizeChainId(chainId);
      config.emitter.emit("change", { chainId: normalizedChainId, accounts });

      return { chainId: normalizedChainId, accounts };
    },
    async disconnect() {
      client.logout();
    },
    async getAccounts() {
      await ensureConnected();

      const defaultChainId = config.chains.at(0)?.id || 0;
      await initializeProvider(defaultChainId);

      const accounts = await provider?.request({
        method: "eth_accounts",
      });

      return accounts;
    },
    async getChainId() {
      await ensureConnected();

      const defaultChainId = config.chains.at(0)?.id || 0;
      await initializeProvider(defaultChainId);

      const chainId = await provider?.request({
        method: "eth_chainId",
      });

      return chainId;
    },
    async getProvider(params: any) {
      if (!provider) {
        const { chainId } = params;
        await client.connect();
        return (provider = await client.getEthereumProvider(chainId));
      }
      return provider;
    },
    async switchChain({ chainId }) {
      const chain = config.chains.find((x) => x.id === chainId);
      if (!chain) throw new Error(`Chain ${chainId} not found`);

      provider = await client.getEthereumProvider(chainId);
      const newChainId = await provider.request({
        method: "eth_chainId",
      });
      const normalizedNewChainId = normalizeChainId(newChainId);
      if (chain.id === normalizedNewChainId)
        config.emitter.emit("change", { chainId });

      return chain;
    },
    async isAuthorized() {
      const isAuthorized = client.isAuthenticated;

      return isAuthorized;
    },
    async onAccountsChanged(accounts: any) {
      config.emitter.emit("change", { accounts });
    },
    async onChainChanged(chain) {
      const chainId = normalizeChainId(chain);
      config.emitter.emit("change", { chainId });
    },

    async onDisconnect() {
      config.emitter.emit("disconnect");
    },
  }));

  return tweedConnector;
};

const normalizeChainId = (chainId: bigint | number | string | unknown) => {
  if (typeof chainId === "string")
    return Number.parseInt(
      chainId,
      chainId.trim().substring(0, 2) === "0x" ? 16 : 10
    );
  if (typeof chainId === "bigint") return Number(chainId);
  if (typeof chainId === "number") return chainId;

  throw new Error(
    `Cannot normalize chainId "${chainId}" of type "${typeof chainId}"`
  );
};
