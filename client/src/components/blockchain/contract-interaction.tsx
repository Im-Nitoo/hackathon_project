import { useWeb3 } from '@/hooks/use-web3';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle, Coins } from 'lucide-react';
import { TOKEN_CONTRACT_ADDRESS } from '@/lib/web3-config';

export function ContractInteraction() {
  const { isConnected, isCorrectNetwork, tokenBalance, mintTokens, switchToCorrectNetwork } = useWeb3();
  const [amount, setAmount] = useState('10');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Check if the amount is valid
  const isValidAmount = () => {
    const num = parseFloat(amount);
    return !isNaN(num) && num > 0 && num <= 100;
  };
  
  // Handle minting tokens
  const handleMint = async () => {
    if (!isValidAmount()) return;
    
    setIsProcessing(true);
    try {
      if (!isCorrectNetwork) {
        await switchToCorrectNetwork();
      }
      
      await mintTokens(parseFloat(amount));
    } catch (error) {
      console.error('Error minting tokens:', error);
    } finally {
      setIsProcessing(false);
    }
  };
  
  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Contract Interaction</CardTitle>
          <CardDescription>
            Interact with TruthTokens on Sepolia Testnet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/20 dark:border-blue-900 dark:text-blue-400">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Connect Wallet First</AlertTitle>
            <AlertDescription>
              Please connect your wallet to interact with the TruthToken contract.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Coins className="mr-2 h-5 w-5 text-primary" />
          TruthToken Contract
        </CardTitle>
        <CardDescription>
          Interact with TruthToken contract on Sepolia Testnet
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg bg-muted p-3">
          <span className="text-sm text-muted-foreground">Contract Address</span>
          <p className="text-xs font-mono mt-1 break-all">
            {TOKEN_CONTRACT_ADDRESS || 'Contract address not available'}
          </p>
        </div>
        
        <div className="rounded-lg bg-muted p-3">
          <span className="text-sm text-muted-foreground">Your Token Balance</span>
          <p className="text-xl font-semibold mt-1">{tokenBalance || '0'} TT</p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="mint-amount">Mint Amount (1-100)</Label>
          <div className="flex space-x-2">
            <Input
              id="mint-amount"
              type="number"
              min="1"
              max="100"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isProcessing || !isCorrectNetwork}
              className="flex-1"
            />
            <Button
              onClick={handleMint}
              disabled={isProcessing || !isConnected || !isCorrectNetwork || !isValidAmount()}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Mint Tokens'
              )}
            </Button>
          </div>
        </div>
        
        {!isCorrectNetwork && (
          <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-700 dark:text-amber-400">Wrong Network</AlertTitle>
            <AlertDescription>
              Please switch to Sepolia Testnet to interact with our smart contract.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        {!isCorrectNetwork && (
          <Button 
            variant="default" 
            onClick={switchToCorrectNetwork}
            className="w-full"
          >
            Switch to Sepolia Network
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}