import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { hasMetaMask, switchNetwork, getCurrentChainId, TOKEN_ABI, TOKEN_CONTRACT_ADDRESS, DEFAULT_CHAIN_ID } from '@/lib/web3-config';
import { useToast } from './use-toast';

// Type definitions for our hook
interface Web3State {
  account: string | null;
  chainId: number | null;
  isConnecting: boolean;
  isConnected: boolean;
  hasMetaMask: boolean;
  isCorrectNetwork: boolean;
  balance: string | null;
  tokenBalance: string | null;
  error: Error | null;
}

interface Web3ContextType extends Web3State {
  connect: () => Promise<void>;
  disconnect: () => void;
  mintTokens: (amount: number) => Promise<boolean>;
  isCorrectChain: () => Promise<boolean>;
  switchToCorrectNetwork: () => Promise<boolean>;
}

// Create context
const Web3Context = createContext<Web3ContextType | null>(null);

// Provider component
export const Web3Provider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();
  const [state, setState] = useState<Web3State>({
    account: null,
    chainId: null,
    isConnecting: false,
    isConnected: false,
    hasMetaMask: false,
    isCorrectNetwork: false,
    balance: null,
    tokenBalance: null,
    error: null
  });

  // Check for MetaMask on mount
  useEffect(() => {
    setState(prev => ({ ...prev, hasMetaMask: hasMetaMask() }));
    
    // Setup event listeners for MetaMask
    const setupListeners = async () => {
      if (!hasMetaMask()) return;
      
      // Check initial connection status
      try {
        const accounts = await window.ethereum!.request({ method: 'eth_accounts' });
        const chainId = await getCurrentChainId();
        const isConnected = accounts && accounts.length > 0;
        
        setState(prev => ({
          ...prev,
          account: isConnected ? accounts[0] : null,
          chainId,
          isConnected,
          isCorrectNetwork: chainId === DEFAULT_CHAIN_ID
        }));
        
        if (isConnected) {
          fetchBalances(accounts[0]);
        }
      } catch (error) {
        console.error('Error checking initial connection:', error);
      }
      
      // Handle account changes
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          // User disconnected
          setState(prev => ({
            ...prev,
            account: null,
            isConnected: false,
            balance: null,
            tokenBalance: null
          }));
        } else {
          // Account changed
          setState(prev => ({
            ...prev,
            account: accounts[0],
            isConnected: true
          }));
          fetchBalances(accounts[0]);
        }
      };
      
      // Handle chain changes
      const handleChainChanged = (chainIdHex: string) => {
        const chainId = parseInt(chainIdHex, 16);
        setState(prev => ({
          ...prev,
          chainId,
          isCorrectNetwork: chainId === DEFAULT_CHAIN_ID
        }));
        
        // Reload balances if connected
        if (state.account) {
          fetchBalances(state.account);
        }
      };
      
      window.ethereum!.on('accountsChanged', handleAccountsChanged);
      window.ethereum!.on('chainChanged', handleChainChanged);
      
      return () => {
        window.ethereum!.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum!.removeListener('chainChanged', handleChainChanged);
      };
    };
    
    setupListeners();
  }, []);
  
  // Function to fetch ETH and token balances
  const fetchBalances = async (account: string) => {
    if (!account) return;
    
    try {
      // Fetch ETH balance
      const balanceHex = await window.ethereum!.request({
        method: 'eth_getBalance',
        params: [account, 'latest']
      });
      
      const balance = parseInt(balanceHex, 16) / 1e18; // Convert from wei to ETH
      
      setState(prev => ({ ...prev, balance: balance.toFixed(4) }));
      
      // Fetch token balance if on the correct network
      if (state.chainId === DEFAULT_CHAIN_ID && TOKEN_CONTRACT_ADDRESS) {
        await fetchTokenBalance(account);
      }
    } catch (error) {
      console.error('Error fetching balances:', error);
    }
  };
  
  // Fetch token balance
  const fetchTokenBalance = async (account: string) => {
    if (!window.ethereum || !TOKEN_CONTRACT_ADDRESS) return;
    
    try {
      const { ethers } = await import('ethers');
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(TOKEN_CONTRACT_ADDRESS, TOKEN_ABI, provider);
      
      const balance = await contract.balanceOf(account);
      // You may need to adjust this based on your token's decimals
      const tokenBalance = ethers.formatUnits(balance, 18);
      
      setState(prev => ({ ...prev, tokenBalance }));
    } catch (error) {
      console.error('Error fetching token balance:', error);
    }
  };
  
  // Connect to MetaMask
  const connect = async () => {
    if (!hasMetaMask()) {
      toast({
        title: 'MetaMask not detected',
        description: 'Please install MetaMask browser extension to connect.',
        variant: 'destructive'
      });
      return;
    }
    
    setState(prev => ({ ...prev, isConnecting: true, error: null }));
    
    try {
      // Request account access
      const accounts = await window.ethereum!.request({
        method: 'eth_requestAccounts'
      });
      
      // Check network and switch if needed
      const chainId = await getCurrentChainId();
      const isCorrectNetwork = chainId === DEFAULT_CHAIN_ID;
      
      if (!isCorrectNetwork) {
        await switchNetwork();
      }
      
      setState(prev => ({
        ...prev,
        account: accounts[0],
        chainId,
        isConnected: true,
        isCorrectNetwork: chainId === DEFAULT_CHAIN_ID,
        isConnecting: false
      }));
      
      fetchBalances(accounts[0]);
      
      toast({
        title: 'Connected to MetaMask',
        description: `Account: ${accounts[0].substring(0, 6)}...${accounts[0].substring(38)}`,
      });
    } catch (error: any) {
      console.error('Error connecting to MetaMask:', error);
      setState(prev => ({ ...prev, isConnecting: false, error }));
      
      toast({
        title: 'Connection Failed',
        description: error.message || 'Could not connect to MetaMask',
        variant: 'destructive'
      });
    }
  };
  
  // Disconnect from MetaMask
  const disconnect = () => {
    setState(prev => ({
      ...prev,
      account: null,
      isConnected: false,
      balance: null,
      tokenBalance: null
    }));
    
    toast({
      title: 'Disconnected',
      description: 'Successfully disconnected from MetaMask'
    });
  };
  
  // Check if we're on the correct chain
  const isCorrectChain = async () => {
    const chainId = await getCurrentChainId();
    return chainId === DEFAULT_CHAIN_ID;
  };
  
  // Switch to the correct network
  const switchToCorrectNetwork = async () => {
    const result = await switchNetwork();
    if (result) {
      const chainId = await getCurrentChainId();
      setState(prev => ({
        ...prev,
        chainId,
        isCorrectNetwork: chainId === DEFAULT_CHAIN_ID
      }));
    }
    return result;
  };
  
  // Mint tokens (if the contract allows it)
  const mintTokens = async (amount: number): Promise<boolean> => {
    if (!state.account || !hasMetaMask() || !TOKEN_CONTRACT_ADDRESS) {
      toast({
        title: 'Cannot mint tokens',
        description: 'Please connect to MetaMask first',
        variant: 'destructive'
      });
      return false;
    }
    
    // Check if we're on the correct network
    const isCorrect = await isCorrectChain();
    if (!isCorrect) {
      const switched = await switchToCorrectNetwork();
      if (!switched) {
        toast({
          title: 'Wrong Network',
          description: 'Please switch to the correct network to mint tokens',
          variant: 'destructive'
        });
        return false;
      }
    }
    
    try {
      const { ethers } = await import('ethers');
      const provider = new ethers.BrowserProvider(window.ethereum!);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(TOKEN_CONTRACT_ADDRESS, TOKEN_ABI, signer);
      
      // This assumes your contract has a mint function
      // You may need to adjust based on your contract's actual function
      const tx = await contract.mint(state.account, ethers.parseUnits(amount.toString(), 18));
      
      toast({
        title: 'Transaction Sent',
        description: 'Minting tokens... Please wait for confirmation',
      });
      
      await tx.wait();
      
      toast({
        title: 'Tokens Minted',
        description: `Successfully minted ${amount} tokens!`,
      });
      
      // Refresh token balance
      fetchTokenBalance(state.account);
      return true;
    } catch (error: any) {
      console.error('Error minting tokens:', error);
      
      toast({
        title: 'Minting Failed',
        description: error.message || 'Could not mint tokens',
        variant: 'destructive'
      });
      
      return false;
    }
  };
  
  const contextValue: Web3ContextType = {
    ...state,
    connect,
    disconnect,
    mintTokens,
    isCorrectChain,
    switchToCorrectNetwork
  };
  
  return (
    <Web3Context.Provider value={contextValue}>
      {children}
    </Web3Context.Provider>
  );
};

// Hook to use the Web3 context
export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};