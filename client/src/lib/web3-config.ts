// Configuration for Web3 and Ethereum connections
// This file handles MetaMask integration and smart contract configuration

// Token contract ABI (Application Binary Interface)
// This is the interface that tells our code how to interact with the smart contract
export const TOKEN_ABI = [
  // TruthToken functionality
  "function name() external view returns (string)",
  "function symbol() external view returns (string)",
  "function decimals() external view returns (uint8)",
  "function totalSupply() external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function transfer(address recipient, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function transferFrom(address sender, address recipient, uint256 amount) external returns (bool)",
  
  // Minting functionality (likely restricted to owner/admin roles)
  "function mint(address to, uint256 amount) external",
  
  // Events
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)"
];

// Contract address configuration from environment variables
export const TOKEN_CONTRACT_ADDRESS = import.meta.env.VITE_TOKEN_CONTRACT_ADDRESS as string;

// Default Ethereum network settings
export const DEFAULT_CHAIN_ID = import.meta.env.VITE_ETHEREUM_NETWORK === 'sepolia' ? 11155111 : 1;
export const NETWORK_NAME = import.meta.env.VITE_ETHEREUM_NETWORK || 'sepolia';

// Chain configuration information
// This helps with adding the network to MetaMask if needed
export const CHAIN_CONFIG = {
  sepolia: {
    chainId: '0xAA36A7', // 11155111 in hex
    chainName: 'Sepolia Testnet',
    nativeCurrency: {
      name: 'Sepolia Ether',
      symbol: 'SEP',
      decimals: 18
    },
    rpcUrls: [
      import.meta.env.VITE_ETHEREUM_PROVIDER || 'https://sepolia.infura.io/v3/'
    ],
    blockExplorerUrls: ['https://sepolia.etherscan.io/']
  },
  mainnet: {
    chainId: '0x1', // 1 in hex
    chainName: 'Ethereum Mainnet',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    },
    rpcUrls: [
      import.meta.env.VITE_ETHEREUM_PROVIDER || 'https://mainnet.infura.io/v3/'
    ],
    blockExplorerUrls: ['https://etherscan.io/']
  }
};

// Check if MetaMask is available in the browser
export function hasMetaMask(): boolean {
  return typeof window !== 'undefined' && !!window.ethereum;
}

// Get the current chain ID that MetaMask is connected to
export async function getCurrentChainId(): Promise<number | null> {
  if (!hasMetaMask()) {
    return null;
  }
  
  try {
    const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
    return parseInt(chainIdHex, 16);
  } catch (error) {
    console.error('Error getting chain ID:', error);
    return null;
  }
}

// Check if the user is connected to the correct network
export async function isConnectedToCorrectNetwork(): Promise<boolean> {
  const currentChainId = await getCurrentChainId();
  return currentChainId === DEFAULT_CHAIN_ID;
}

// Add our network to MetaMask
export async function addNetwork(): Promise<boolean> {
  if (!hasMetaMask()) {
    return false;
  }
  
  const networkConfig = CHAIN_CONFIG[NETWORK_NAME as keyof typeof CHAIN_CONFIG];
  if (!networkConfig) {
    console.error(`Network configuration not found for ${NETWORK_NAME}`);
    return false;
  }
  
  try {
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [networkConfig]
    });
    return true;
  } catch (error) {
    console.error('Error adding network to MetaMask:', error);
    return false;
  }
}

// Switch to the correct network in MetaMask
export async function switchNetwork(): Promise<boolean> {
  if (!hasMetaMask()) {
    return false;
  }
  
  const networkConfig = CHAIN_CONFIG[NETWORK_NAME as keyof typeof CHAIN_CONFIG];
  if (!networkConfig) {
    console.error(`Network configuration not found for ${NETWORK_NAME}`);
    return false;
  }
  
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: networkConfig.chainId }]
    });
    return true;
  } catch (error: any) {
    // If the chain hasn't been added to MetaMask
    if (error.code === 4902) {
      return await addNetwork();
    }
    console.error('Error switching network:', error);
    return false;
  }
}