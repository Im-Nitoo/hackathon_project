// Ethereum connection configuration
import { useToast } from '@/hooks/use-toast';

// Sepolia testnet chain ID
export const DEFAULT_CHAIN_ID = 11155111;

// Contract address for TruthToken on Sepolia testnet
export const TOKEN_CONTRACT_ADDRESS = '0x56dc2b333a73C3ADEFdc2b04DfEE198c77355b4c';

// ERC20 ABI for TruthToken
export const TOKEN_ABI = [
  // ERC20 Standard interface
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  
  // Events
  "event Transfer(address indexed from, address indexed to, uint256 amount)",
  "event Approval(address indexed owner, address indexed spender, uint256 amount)",
  
  // For testing mint function (if available)
  "function mint(address to, uint256 amount) returns (bool)"
];

// Sepolia configuration for MetaMask
const CHAIN_CONFIG = {
  chainId: `0x${DEFAULT_CHAIN_ID.toString(16)}`,
  chainName: 'Sepolia',
  nativeCurrency: {
    name: 'Sepolia ETH',
    symbol: 'ETH',
    decimals: 18
  },
  rpcUrls: ['https://sepolia.infura.io/v3/'],
  blockExplorerUrls: ['https://sepolia.etherscan.io']
};

/**
 * Check if MetaMask is installed
 */
export function hasMetaMask(): boolean {
  return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined' && !!window.ethereum.isMetaMask;
}

/**
 * Get the current chain ID from MetaMask
 */
export async function getCurrentChainId(): Promise<number> {
  if (!hasMetaMask()) throw new Error('MetaMask not installed');
  
  try {
    if (!window.ethereum) throw new Error('MetaMask not available');
    const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
    return parseInt(chainIdHex as string, 16);
  } catch (error) {
    console.error('Error getting chain ID:', error);
    throw error;
  }
}

/**
 * Switch to Sepolia network
 */
export async function switchNetwork(): Promise<boolean> {
  if (!hasMetaMask()) return false;
  if (!window.ethereum) return false;
  
  try {
    // First try to switch to the network
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: CHAIN_CONFIG.chainId }],
    });
    return true;
  } catch (switchError: any) {
    // This error code indicates that the chain has not been added to MetaMask.
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [CHAIN_CONFIG],
        });
        return true;
      } catch (addError) {
        console.error('Error adding network:', addError);
        return false;
      }
    }
    console.error('Error switching network:', switchError);
    return false;
  }
}

/**
 * Request account access from MetaMask
 */
export async function requestAccounts(): Promise<string[]> {
  if (!hasMetaMask()) throw new Error('MetaMask not installed');
  if (!window.ethereum) throw new Error('MetaMask not available');
  
  try {
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts'
    });
    return accounts as string[];
  } catch (error) {
    console.error('Error requesting accounts:', error);
    throw error;
  }
}