import { Network, TweedClient } from "@paytweed/core-js";
import { EthereumProvider } from "@paytweed/core-js/lib/Eip1193Provider";
import { createConnector } from "@wagmi/core";

type StorageItem = { "tweedSDK.connected": boolean };

export class TweedConnector {
  private client: TweedClient | null = null;
  private provider: EthereumProvider | undefined;
  private appId: string;
  private chains: Network[];
  constructor(appId: string, chains: Network[]) {
    this.appId = appId;
    this.chains = chains;
  }

  private async initialize(appId: string, chains: Network[]) {
    this.client = await TweedClient.create(appId, { chains });
    return this.client;
  }

  private async ensureConnected() {
    if (!this.client) await this.initialize(this.appId, this.chains);
    const isAuthorized = this.client?.isAuthenticated;
    if (!isAuthorized) await this.client?.connect();
  }

  private async initializeProvider(chainId: number) {
    await this.ensureConnected();
    if (!this.provider) {
      this.provider = await this.client?.getEthereumProvider(chainId);
    }
  }

  createConnector() {
    return createConnector<EthereumProvider, any, StorageItem>((config) => ({
      id: "tweed",
      name: "Tweed",
      icon: "https://paytweed-assets.s3.amazonaws.com/logo-square-black.png",
      type: "injected",

      connect: async () => {
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
        await config.storage?.setItem("tweedSDK.connected", true);

        return { chainId: normalizedChainId, accounts };
      },

      disconnect: async () => {
        this.client?.logout();
        await config.storage?.removeItem("tweedSDK.connected");
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
        const isconnected = await config.storage?.getItem("tweedSDK.connected");
        if (!isconnected) {
          console.warn(
            "Cannot get provider, User is disconnected, please connect using useConnect hook first."
          );
          return this.provider as EthereumProvider;
        }

        const initialChainId = params?.chainId || config.chains.at(0)?.id || 0;
        if (!this.provider) {
          await this.ensureConnected();
          if (!initialChainId) throw new Error("chainId is required");
          this.provider = await this.client?.getEthereumProvider(
            initialChainId
          );
        }
        if (!this.provider) throw new Error("Provider not found");
        return this.provider;
      },

      switchChain: async ({ chainId }: { chainId: number }) => {
        const chain = config.chains.find((chain) => chain.id === chainId);
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
        const isconnected = await config.storage?.getItem("tweedSDK.connected");

        if (isconnected) return true;

        return false;
      },

      onAccountsChanged: async (accounts: any) => {
        config.emitter.emit("change", { accounts });
      },

      onChainChanged: async (chain: any) => {
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
