// Type definitions for window.ethereum (MetaMask)
interface Window {
  ethereum?: {
    isMetaMask?: boolean;
    request: (request: { method: string; params?: Array<any> }) => Promise<any>;
    on: (eventName: string, callback: (...args: any[]) => void) => void;
    removeListener: (eventName: string, callback: (...args: any[]) => void) => void;
    selectedAddress: string | undefined;
    chainId: string;
    isConnected: () => boolean;
    autoRefreshOnNetworkChange?: boolean;
  };
}