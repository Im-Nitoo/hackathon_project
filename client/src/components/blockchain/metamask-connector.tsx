import { useWeb3 } from '@/hooks/use-web3';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Wallet, ShieldAlert, Check, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function MetamaskConnector() {
  const { 
    hasMetaMask, 
    isConnected, 
    account, 
    balance, 
    tokenBalance, 
    isConnecting, 
    isCorrectNetwork,
    chainId,
    connect, 
    disconnect,
    switchToCorrectNetwork
  } = useWeb3();
  
  const { toast } = useToast();
  
  // Format account address for display
  const formatAddress = (address: string | null) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };
  
  // Handle copy address to clipboard
  const copyAddress = () => {
    if (!account) return;
    
    navigator.clipboard.writeText(account);
    toast({
      title: 'Address Copied',
      description: 'Wallet address copied to clipboard',
    });
  };
  
  // Create Etherscan URL for the connected account
  const getEtherscanUrl = () => {
    const baseUrl = isCorrectNetwork ? 'https://sepolia.etherscan.io' : 'https://etherscan.io';
    return `${baseUrl}/address/${account}`;
  };
  
  if (!hasMetaMask) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>MetaMask Required</CardTitle>
          <CardDescription>
            MetaMask extension is required to connect your wallet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="border-red-500 bg-red-50 dark:bg-red-950/20">
            <ShieldAlert className="h-4 w-4 text-red-600" />
            <AlertTitle className="text-red-700 dark:text-red-400">MetaMask Not Detected</AlertTitle>
            <AlertDescription>
              Please install the MetaMask browser extension to use this feature.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter>
          <Button
            variant="outline"
            onClick={() => window.open('https://metamask.io/download/', '_blank')}
            className="w-full"
          >
            Install MetaMask
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  if (!isConnected) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Connect Wallet</CardTitle>
          <CardDescription>
            Connect to MetaMask to interact with the blockchain
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center mb-4">
            <Wallet className="h-16 w-16 text-primary/80" />
          </div>
          <p className="text-sm text-muted-foreground text-center">
            To use decentralized features, please connect your MetaMask wallet.
          </p>
        </CardContent>
        <CardFooter>
          <Button
            onClick={connect}
            disabled={isConnecting}
            className="w-full"
          >
            {isConnecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              'Connect to MetaMask'
            )}
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Wallet className="mr-2 h-5 w-5 text-primary" />
          Connected Wallet
          {isCorrectNetwork && (
            <span className="ml-2 inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
              <Check className="mr-1 h-3 w-3" /> 
              Correct Network
            </span>
          )}
        </CardTitle>
        <CardDescription>
          Your wallet is connected to {isCorrectNetwork ? 'Sepolia Testnet' : `Chain ID: ${chainId}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg bg-muted p-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Address:</span>
            <button 
              onClick={copyAddress}
              className="text-sm font-mono bg-background px-2 py-1 rounded border hover:bg-accent"
            >
              {formatAddress(account)}
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-muted p-3">
            <span className="text-sm text-muted-foreground">ETH Balance</span>
            <p className="text-xl font-semibold mt-1">{balance || '0.0000'}</p>
          </div>
          <div className="rounded-lg bg-muted p-3">
            <span className="text-sm text-muted-foreground">Token Balance</span>
            <p className="text-xl font-semibold mt-1">{isCorrectNetwork ? (tokenBalance || '0') : 'N/A'}</p>
          </div>
        </div>
        
        {!isCorrectNetwork && (
          <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
            <ShieldAlert className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-700 dark:text-amber-400">Wrong Network</AlertTitle>
            <AlertDescription>
              Please switch to Sepolia Testnet to interact with our smart contract.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="flex justify-between gap-4">
        {!isCorrectNetwork ? (
          <Button 
            variant="default" 
            onClick={switchToCorrectNetwork}
            className="flex-1"
          >
            Switch Network
          </Button>
        ) : (
          <Button 
            variant="outline" 
            onClick={() => window.open(getEtherscanUrl(), '_blank')}
            size="sm"
            className="flex-1"
          >
            View on Etherscan
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        )}
        <Button 
          variant="destructive" 
          onClick={disconnect}
          size="sm"
          className="flex-1"
        >
          Disconnect
        </Button>
      </CardFooter>
    </Card>
  );
}