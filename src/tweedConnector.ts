import { Network, TweedClient } from "@paytweed/core-js";
import { EthereumProvider } from "@paytweed/core-js/lib/Eip1193Provider";
import { createConnector } from "@wagmi/core";

export class TweedConnector {
  private client: TweedClient | null = null;
  private provider: EthereumProvider | undefined;
  constructor(appId: string, chains: Network[]) {
    this.initialize(appId, chains);
  }

  private async initialize(appId: string, chains: Network[]) {
    this.client = await TweedClient.create(appId, { chains });
  }

  private async ensureConnected() {
    const isAuthorized = this.client?.isAuthenticated;
    if (!isAuthorized) await this.client?.connect();
  }

  private async initializeProvider(chainId: number) {
    if (!this.provider) {
      this.provider = await this.client?.getEthereumProvider(chainId);
    }
  }

  createConnector() {
    return createConnector<EthereumProvider>((config) => ({
      id: "tweed",
      name: "Tweed",
      icon: "https://paytweed-assets.s3.amazonaws.com/logo-square-black.png",
      type: "injected",

      connect: async () => {
        await this.ensureConnected();
        const defaultChainId = config.chains.at(0)?.id || 0;
        await this.initializeProvider(defaultChainId);

        const accounts = await this.provider?.request({
          method: "eth_accounts",
        });

        const chainId = await this.provider?.request({
          method: "eth_chainId",
        });

        const normalizedChainId = this.normalizeChainId(chainId);

        config.emitter.emit("change", { chainId: normalizedChainId, accounts });

        return { chainId: normalizedChainId, accounts };
      },

      disconnect: async () => {
        this.client?.logout();
      },

      getAccounts: async () => {
        await this.ensureConnected();

        const defaultChainId = config.chains.at(0)?.id || 0;
        await this.initializeProvider(defaultChainId);

        const accounts = await this.provider?.request({
          method: "eth_accounts",
        });

        return accounts;
      },

      getChainId: async () => {
        await this.ensureConnected();

        const defaultChainId = config.chains.at(0)?.id || 0;
        await this.initializeProvider(defaultChainId);

        const chainId = await this.provider?.request({
          method: "eth_chainId",
        });

        return chainId;
      },

      getProvider: async (
        params: { chainId?: number | undefined } | undefined
      ): Promise<EthereumProvider> => {
        if (!this.provider) {
          await this.client?.connect();
          if (!params?.chainId) throw new Error("chainId is required");
          this.provider = await this.client?.getEthereumProvider(
            params?.chainId
          );
        }
        if (!this.provider) throw new Error("Provider not found");
        return this.provider;
      },

      switchChain: async ({ chainId }) => {
        const chain = config.chains.find((x) => x.id === chainId);
        if (!chain) throw new Error(`Chain ${chainId} not found`);

        this.provider = await this.client?.getEthereumProvider(chainId);
        const newChainId = await this.provider?.request({
          method: "eth_chainId",
        });
        const normalizedNewChainId = this.normalizeChainId(newChainId);

        if (chain.id === normalizedNewChainId)
          config.emitter.emit("change", { chainId });

        return chain;
      },

      isAuthorized: async () => {
        if (!this.client) return false;
        const isAuthorized = this.client?.isAuthenticated;
        return isAuthorized;
      },

      onAccountsChanged: async (accounts: any) => {
        config.emitter.emit("change", { accounts });
      },

      onChainChanged: async (chain) => {
        const chainId = this.normalizeChainId(chain);
        config.emitter.emit("change", { chainId });
      },

      onDisconnect: async () => {
        config.emitter.emit("disconnect");
      },
    }));
  }

  normalizeChainId(chainId: any) {
    if (typeof chainId === "string") {
      return Number.parseInt(
        chainId,
        chainId.trim().substring(0, 2) === "0x" ? 16 : 10
      );
    }

    if (typeof chainId === "bigint") {
      return Number(chainId);
    }

    if (typeof chainId === "number") {
      return chainId;
    }

    throw new Error(
      `Cannot normalize chainId "${chainId}" of type "${typeof chainId}"`
    );
  }
}
