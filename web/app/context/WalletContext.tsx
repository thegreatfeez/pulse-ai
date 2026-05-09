'use client';

import { BrowserProvider, JsonRpcSigner } from 'ethers';
import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { BASE_SEPOLIA_CHAIN_ID_HEX, BASE_SEPOLIA_CHAIN_ID } from '@/lib/contracts';

const STORAGE_KEY = 'stash_connected';
const STORAGE_RDNS = 'stash_wallet_rdns';

type EthereumRequestArguments = {
  method: string;
  params?: unknown[];
};

type EthereumEvent = 'accountsChanged' | 'chainChanged' | 'disconnect';
type EthereumListener = (...args: unknown[]) => void;

export type EIP1193Provider = {
  request: (args: EthereumRequestArguments) => Promise<unknown>;
  on: (event: EthereumEvent, listener: EthereumListener) => void;
  removeListener?: (event: EthereumEvent, listener: EthereumListener) => void;
  isMetaMask?: boolean;
};

export interface EIP6963ProviderInfo {
  uuid: string;
  name: string;
  icon: string;
  rdns: string;
}

export interface EIP6963ProviderDetail {
  info: EIP6963ProviderInfo;
  provider: EIP1193Provider;
}

declare global {
  interface Window {
    ethereum?: EIP1193Provider;
  }
}

type ProviderError = {
  code?: number;
};

const isProviderError = (error: unknown): error is ProviderError =>
  typeof error === 'object' && error !== null && 'code' in error;

interface WalletContextType {
  address: string | null;
  signer: JsonRpcSigner | null;
  provider: BrowserProvider | null;
  isConnected: boolean;
  isConnecting: boolean;
  isWrongNetwork: boolean;
  chainId: string | null;
  hasInjectedWallet: boolean;
  detectedWallets: EIP6963ProviderDetail[];
  isWalletModalOpen: boolean;
  openWalletModal: () => void;
  closeWalletModal: () => void;
  connectWith: (provider: EIP1193Provider, rdns?: string) => Promise<void>;
  disconnect: () => void;
  switchToBaseSepolia: () => Promise<void>;
}

const defaultContext: WalletContextType = {
  address: null,
  signer: null,
  provider: null,
  isConnected: false,
  isConnecting: false,
  isWrongNetwork: false,
  chainId: null,
  hasInjectedWallet: false,
  detectedWallets: [],
  isWalletModalOpen: false,
  openWalletModal: () => {},
  closeWalletModal: () => {},
  connectWith: async () => {},
  disconnect: () => {},
  switchToBaseSepolia: async () => {},
};

const WalletContext = createContext<WalletContextType>(defaultContext);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [activeRawProvider, setActiveRawProvider] = useState<EIP1193Provider | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [chainId, setChainId] = useState<string | null>(null);
  const [hasInjectedWallet, setHasInjectedWallet] = useState(false);
  const [detectedWallets, setDetectedWallets] = useState<EIP6963ProviderDetail[]>([]);
  const [isWalletModalOpen, setWalletModalOpen] = useState(false);

  // Detect wallets via EIP-6963 announcement events
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const seen = new Map<string, EIP6963ProviderDetail>();

    const onAnnounce = (event: Event) => {
      const detail = (event as CustomEvent<EIP6963ProviderDetail>).detail;
      if (!detail) return;
      seen.set(detail.info.uuid, detail);
       
      setDetectedWallets(Array.from(seen.values()));
    };

    window.addEventListener('eip6963:announceProvider', onAnnounce as EventListener);
    window.dispatchEvent(new Event('eip6963:requestProvider'));

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasInjectedWallet(!!window.ethereum);

    return () => window.removeEventListener('eip6963:announceProvider', onAnnounce as EventListener);
  }, []);

  const switchToBaseSepoliaOn = useCallback(
    async (target: EIP1193Provider) => {
      try {
        await target.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: BASE_SEPOLIA_CHAIN_ID_HEX }],
        });
      } catch (error: unknown) {
        if (isProviderError(error) && error.code === 4902) {
          await target.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: BASE_SEPOLIA_CHAIN_ID_HEX,
                chainName: 'Base Sepolia',
                nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
                rpcUrls: ['https://sepolia.base.org'],
                blockExplorerUrls: ['https://sepolia.basescan.org'],
              },
            ],
          });
        } else {
          throw error;
        }
      }
    },
    [],
  );

  const switchToBaseSepolia = useCallback(async () => {
    const target = activeRawProvider ?? window.ethereum;
    if (!target) return;
    await switchToBaseSepoliaOn(target);
  }, [activeRawProvider, switchToBaseSepoliaOn]);

  const refreshFromProvider = useCallback(async (rawProvider: EIP1193Provider) => {
    const nextProvider = new BrowserProvider(rawProvider);
    const accounts = (await nextProvider.send('eth_accounts', [])) as string[];
    if (!accounts || accounts.length === 0) {
      setProvider(null);
      setSigner(null);
      setAddress(null);
      setChainId(null);
      setActiveRawProvider(null);
      return;
    }

    const nextSigner = await nextProvider.getSigner();
    const nextAddress = await nextSigner.getAddress();
    const network = await nextProvider.getNetwork();
    const nextChainId = `0x${network.chainId.toString(16)}`;

    setProvider(nextProvider);
    setSigner(nextSigner);
    setAddress(nextAddress);
    setChainId(nextChainId);
    setActiveRawProvider(rawProvider);
  }, []);

  const connectWith = useCallback(
    async (rawProvider: EIP1193Provider, rdns?: string) => {
      setIsConnecting(true);

      try {
        const nextProvider = new BrowserProvider(rawProvider);
        await nextProvider.send('eth_requestAccounts', []);

        const nextSigner = await nextProvider.getSigner();
        const nextAddress = await nextSigner.getAddress();
        const network = await nextProvider.getNetwork();
        const nextChainId = `0x${network.chainId.toString(16)}`;

        setProvider(nextProvider);
        setSigner(nextSigner);
        setAddress(nextAddress);
        setChainId(nextChainId);
        setActiveRawProvider(rawProvider);

        if (nextChainId !== BASE_SEPOLIA_CHAIN_ID_HEX) {
          try {
            await switchToBaseSepoliaOn(rawProvider);
          } catch {
            /* user may decline; isWrongNetwork stays true */
          }
        }

        window.localStorage.setItem(STORAGE_KEY, 'true');
        if (rdns) window.localStorage.setItem(STORAGE_RDNS, rdns);
        setWalletModalOpen(false);
      } catch (error) {
        console.error('Connection failed:', error);
      } finally {
        setIsConnecting(false);
      }
    },
    [switchToBaseSepoliaOn],
  );

  const disconnect = useCallback(() => {
    setAddress(null);
    setSigner(null);
    setProvider(null);
    setActiveRawProvider(null);
    setChainId(null);
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(STORAGE_RDNS);
  }, []);

  // Auto-reconnect on mount + listen for active provider events
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const reconnectTimer = window.setTimeout(() => {
      if (window.localStorage.getItem(STORAGE_KEY) !== 'true') return;
      const rdns = window.localStorage.getItem(STORAGE_RDNS);
      const target =
        (rdns && detectedWallets.find((w) => w.info.rdns === rdns)?.provider) ?? window.ethereum;
      if (target) void refreshFromProvider(target);
    }, 50);

    return () => window.clearTimeout(reconnectTimer);
  }, [detectedWallets, refreshFromProvider]);

  // Subscribe to events on the *active* raw provider only
  useEffect(() => {
    if (!activeRawProvider) return;

    const handleAccountsChanged: EthereumListener = (accounts) => {
      if (!Array.isArray(accounts) || accounts.length === 0) {
        disconnect();
        return;
      }
      void refreshFromProvider(activeRawProvider);
    };

    const handleChainChanged: EthereumListener = () => {
      void refreshFromProvider(activeRawProvider);
    };

    activeRawProvider.on('accountsChanged', handleAccountsChanged);
    activeRawProvider.on('chainChanged', handleChainChanged);

    return () => {
      activeRawProvider.removeListener?.('accountsChanged', handleAccountsChanged);
      activeRawProvider.removeListener?.('chainChanged', handleChainChanged);
    };
  }, [activeRawProvider, refreshFromProvider, disconnect]);

  const isWrongNetwork = useMemo(() => {
    if (!chainId) return false;
    try {
      return parseInt(chainId, 16) !== BASE_SEPOLIA_CHAIN_ID;
    } catch {
      return true;
    }
  }, [chainId]);

  const openWalletModal = useCallback(() => setWalletModalOpen(true), []);
  const closeWalletModal = useCallback(() => setWalletModalOpen(false), []);

  const value = useMemo<WalletContextType>(
    () => ({
      address,
      signer,
      provider,
      isConnected: Boolean(address),
      isConnecting,
      isWrongNetwork,
      chainId,
      hasInjectedWallet,
      detectedWallets,
      isWalletModalOpen,
      openWalletModal,
      closeWalletModal,
      connectWith,
      disconnect,
      switchToBaseSepolia,
    }),
    [
      address,
      signer,
      provider,
      isConnecting,
      isWrongNetwork,
      chainId,
      hasInjectedWallet,
      detectedWallets,
      isWalletModalOpen,
      openWalletModal,
      closeWalletModal,
      connectWith,
      disconnect,
      switchToBaseSepolia,
    ],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export const useWallet = () => useContext(WalletContext);
