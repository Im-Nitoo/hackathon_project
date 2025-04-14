import { useState } from 'react';
import { blockchain } from '@/lib/blockchain';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, XCircle, AlertCircle, Database, Wallet, Cpu } from 'lucide-react';
import { MetamaskConnector } from '@/components/blockchain/metamask-connector';
import { ContractInteraction } from '@/components/blockchain/contract-interaction';

export default function BlockchainTest() {
  const [ensName, setEnsName] = useState('');
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);
  const [ensVerifyAddress, setEnsVerifyAddress] = useState('');
  const [ensVerifyName, setEnsVerifyName] = useState('');
  const [verifyResult, setVerifyResult] = useState<boolean | null>(null);
  const [message, setMessage] = useState('Hello from TruthNode!');
  const [signature, setSignature] = useState('');
  const [verifyMessage, setVerifyMessage] = useState('');
  const [verifySignature, setVerifySignature] = useState('');
  const [verifyAddress, setVerifyAddress] = useState('');
  const [signatureVerification, setSignatureVerification] = useState<{
    isValid: boolean;
    recoveredAddress: string | null;
  } | null>(null);
  const [loading, setLoading] = useState({
    resolving: false,
    verifying: false,
    signing: false,
    verifyingSig: false
  });
  const [error, setError] = useState<string | null>(null);

  const resolveENSName = async () => {
    if (!ensName) return;
    
    setLoading(prev => ({ ...prev, resolving: true }));
    setError(null);
    
    try {
      const address = await blockchain.resolveENS(ensName);
      setResolvedAddress(address);
    } catch (err) {
      setError(`Error resolving ENS name: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(prev => ({ ...prev, resolving: false }));
    }
  };

  const verifyENSName = async () => {
    if (!ensVerifyAddress || !ensVerifyName) return;
    
    setLoading(prev => ({ ...prev, verifying: true }));
    setError(null);
    
    try {
      const result = await blockchain.verifyENS(ensVerifyAddress, ensVerifyName);
      setVerifyResult(result);
    } catch (err) {
      setError(`Error verifying ENS name: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(prev => ({ ...prev, verifying: false }));
    }
  };

  const signMessageFunc = async () => {
    if (!message) return;
    
    setLoading(prev => ({ ...prev, signing: true }));
    setError(null);
    
    try {
      const sig = await blockchain.signMessage(message);
      if (sig) {
        setSignature(sig);
      } else {
        setError('Failed to sign message');
      }
    } catch (err) {
      setError(`Error signing message: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(prev => ({ ...prev, signing: false }));
    }
  };

  const verifySignatureFunc = async () => {
    if (!verifyMessage || !verifySignature) return;
    
    setLoading(prev => ({ ...prev, verifyingSig: true }));
    setError(null);
    
    try {
      const result = await blockchain.verifySignature(
        verifyMessage, 
        verifySignature,
        verifyAddress || undefined
      );
      
      setSignatureVerification(result);
    } catch (err) {
      setError(`Error verifying signature: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(prev => ({ ...prev, verifyingSig: false }));
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 flex items-center">
        <Database className="mr-2 h-6 w-6" />
        Blockchain Test Page
      </h1>
      
      <p className="text-muted-foreground mb-6">
        This page allows you to test the integration with Ethereum blockchain and ENS resolution
        through our Infura provider on the Sepolia testnet.
      </p>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Wallet className="mr-2 h-5 w-5" />
            Connect Wallet
          </h2>
          <MetamaskConnector />
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Cpu className="mr-2 h-5 w-5" />
            Smart Contract
          </h2>
          <ContractInteraction />
        </div>
      </div>

      <Tabs defaultValue="ens" className="w-full">
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="ens">ENS Resolution</TabsTrigger>
          <TabsTrigger value="signatures">Signatures</TabsTrigger>
        </TabsList>
        
        <TabsContent value="ens" className="space-y-6 mt-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* ENS Resolution */}
            <Card>
              <CardHeader>
                <CardTitle>Resolve ENS Name</CardTitle>
                <CardDescription>
                  Convert an ENS name to an Ethereum address
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ens-name">ENS Name</Label>
                  <Input
                    id="ens-name"
                    placeholder="e.g. vitalik.eth"
                    value={ensName}
                    onChange={(e) => setEnsName(e.target.value)}
                  />
                </div>
                
                {resolvedAddress !== null && (
                  <Alert className={resolvedAddress ? "border-green-500 bg-green-50 dark:bg-green-950/20" : "border-red-500 bg-red-50 dark:bg-red-950/20"}>
                    {resolvedAddress ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <AlertTitle className="text-green-700 dark:text-green-400">Resolved</AlertTitle>
                        <AlertDescription className="font-mono text-xs break-all">
                          {resolvedAddress}
                        </AlertDescription>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-red-500" />
                        <AlertTitle className="text-red-700 dark:text-red-400">Not Found</AlertTitle>
                        <AlertDescription>
                          This ENS name could not be resolved.
                        </AlertDescription>
                      </>
                    )}
                  </Alert>
                )}
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={resolveENSName} 
                  disabled={!ensName || loading.resolving}
                >
                  {loading.resolving ? 'Resolving...' : 'Resolve'}
                </Button>
              </CardFooter>
            </Card>
            
            {/* ENS Verification */}
            <Card>
              <CardHeader>
                <CardTitle>Verify ENS Ownership</CardTitle>
                <CardDescription>
                  Check if an address owns a specific ENS name
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="verify-address">Ethereum Address</Label>
                  <Input
                    id="verify-address"
                    placeholder="0x..."
                    value={ensVerifyAddress}
                    onChange={(e) => setEnsVerifyAddress(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="verify-ens">ENS Name</Label>
                  <Input
                    id="verify-ens"
                    placeholder="e.g. vitalik.eth"
                    value={ensVerifyName}
                    onChange={(e) => setEnsVerifyName(e.target.value)}
                  />
                </div>
                
                {verifyResult !== null && (
                  <Alert className={verifyResult ? "border-green-500 bg-green-50 dark:bg-green-950/20" : "border-red-500 bg-red-50 dark:bg-red-950/20"}>
                    {verifyResult ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <AlertTitle className="text-green-700 dark:text-green-400">Verified</AlertTitle>
                        <AlertDescription>
                          The address owns this ENS name.
                        </AlertDescription>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-red-500" />
                        <AlertTitle className="text-red-700 dark:text-red-400">Not Verified</AlertTitle>
                        <AlertDescription>
                          The address does not own this ENS name.
                        </AlertDescription>
                      </>
                    )}
                  </Alert>
                )}
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={verifyENSName} 
                  disabled={!ensVerifyAddress || !ensVerifyName || loading.verifying}
                >
                  {loading.verifying ? 'Verifying...' : 'Verify'}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="signatures" className="space-y-6 mt-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Sign Message */}
            <Card>
              <CardHeader>
                <CardTitle>Sign Message</CardTitle>
                <CardDescription>
                  Generate a signature for a message (simulated in demo mode)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Input
                    id="message"
                    placeholder="Enter message to sign"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </div>
                
                {signature && (
                  <div className="space-y-2">
                    <Label>Signature</Label>
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded border font-mono text-xs break-all">
                      {signature}
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={signMessageFunc} 
                  disabled={!message || loading.signing}
                >
                  {loading.signing ? 'Signing...' : 'Sign Message'}
                </Button>
              </CardFooter>
            </Card>
            
            {/* Verify Signature */}
            <Card>
              <CardHeader>
                <CardTitle>Verify Signature</CardTitle>
                <CardDescription>
                  Verify a signature to recover the signing address
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="verify-message">Message</Label>
                  <Input
                    id="verify-message"
                    placeholder="Enter original message"
                    value={verifyMessage}
                    onChange={(e) => setVerifyMessage(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="verify-signature">Signature</Label>
                  <Input
                    id="verify-signature"
                    placeholder="Enter signature"
                    value={verifySignature}
                    onChange={(e) => setVerifySignature(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="verify-signer">Expected Signer (optional)</Label>
                  <Input
                    id="verify-signer"
                    placeholder="0x... (leave empty to just recover address)"
                    value={verifyAddress}
                    onChange={(e) => setVerifyAddress(e.target.value)}
                  />
                </div>
                
                {signatureVerification && (
                  <Alert className={signatureVerification.isValid ? "border-green-500 bg-green-50 dark:bg-green-950/20" : "border-red-500 bg-red-50 dark:bg-red-950/20"}>
                    {signatureVerification.isValid ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <AlertTitle className="text-green-700 dark:text-green-400">Valid Signature</AlertTitle>
                        <AlertDescription>
                          <p>Signature is valid.</p>
                          {signatureVerification.recoveredAddress && (
                            <p className="font-mono text-xs break-all mt-1">
                              Recovered address: {signatureVerification.recoveredAddress}
                            </p>
                          )}
                        </AlertDescription>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-red-500" />
                        <AlertTitle className="text-red-700 dark:text-red-400">Invalid Signature</AlertTitle>
                        <AlertDescription>
                          <p>Signature is not valid for the expected signer.</p>
                          {signatureVerification.recoveredAddress && (
                            <p className="font-mono text-xs break-all mt-1">
                              Recovered address: {signatureVerification.recoveredAddress}
                            </p>
                          )}
                        </AlertDescription>
                      </>
                    )}
                  </Alert>
                )}
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={verifySignatureFunc} 
                  disabled={!verifyMessage || !verifySignature || loading.verifyingSig}
                >
                  {loading.verifyingSig ? 'Verifying...' : 'Verify Signature'}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}